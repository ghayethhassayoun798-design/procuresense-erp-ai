import { authError } from "@/lib/auth.mjs";
import { all } from "@/lib/db.mjs";
export const runtime="nodejs";
const validDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(`${s}T00:00:00.000Z`);return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===s;};
export async function GET(request){
 const denied=await authError(request);if(denied)return denied;
 const q=new URL(request.url).searchParams,from=q.get("from")||"0001-01-01",to=q.get("to")||"9999-12-31";
 if(!validDate(from)||!validDate(to)||from>to)return Response.json({error:"Période invalide. Choisissez deux dates ISO dans le bon ordre."},{status:400});
 const salesRows=await all("SELECT created_at::date date_key,SUM(total_cents) total_cents,COUNT(*) orders FROM sales_orders WHERE status='CONFIRMED' AND created_at::date BETWEEN ? AND ? GROUP BY created_at::date ORDER BY 1",from,to);
 const purchaseRows=await all("SELECT created_at::date date_key,SUM(total_cents) total_cents,COUNT(*) orders FROM purchase_orders WHERE status!='CANCELLED' AND created_at::date BETWEEN ? AND ? GROUP BY created_at::date ORDER BY 1",from,to);
 const sales=salesRows.map(({date_key,...x})=>({day:date_key,...x})),purchases=purchaseRows.map(({date_key,...x})=>({day:date_key,...x}));
 const invoices=await all("SELECT CASE WHEN COALESCE(pay.paid,0)>=i.total_cents THEN 'PAYÉE' WHEN i.due_date<CURRENT_DATE THEN 'EN RETARD' WHEN COALESCE(pay.paid,0)>0 THEN 'PARTIELLE' ELSE 'À PAYER' END status,COUNT(*) count,SUM(GREATEST(0,i.total_cents-COALESCE(pay.paid,0))) balance_cents FROM invoices i LEFT JOIN (SELECT invoice_id,SUM(amount_cents) paid FROM payments GROUP BY invoice_id) pay ON pay.invoice_id=i.id WHERE i.created_at::date BETWEEN ? AND ? GROUP BY status",from,to);
 const top_customers=await all("SELECT c.name,SUM(o.total_cents) sales_cents,COUNT(o.id) orders FROM sales_orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='CONFIRMED' AND o.created_at::date BETWEEN ? AND ? GROUP BY c.id,c.name ORDER BY sales_cents DESC LIMIT 10",from,to);
 const top_products=await all("SELECT p.sku,p.name,SUM(si.quantity) quantity,SUM(si.quantity*si.unit_price_cents) sales_cents FROM sales_items si JOIN products p ON p.id=si.product_id JOIN sales_orders o ON o.id=si.order_id WHERE o.status='CONFIRMED' AND o.created_at::date BETWEEN ? AND ? GROUP BY p.id,p.sku,p.name ORDER BY quantity DESC LIMIT 10",from,to);
 const receivable_cents=(await all("SELECT GREATEST(0,i.total_cents-COALESCE(pay.paid,0)) balance_cents FROM invoices i LEFT JOIN (SELECT invoice_id,SUM(amount_cents) paid FROM payments GROUP BY invoice_id) pay ON pay.invoice_id=i.id WHERE i.created_at::date BETWEEN ? AND ?",from,to)).reduce((n,x)=>n+x.balance_cents,0);
 const overdue_cents=(await all("SELECT GREATEST(0,i.total_cents-COALESCE(pay.paid,0)) balance_cents FROM invoices i LEFT JOIN (SELECT invoice_id,SUM(amount_cents) paid FROM payments GROUP BY invoice_id) pay ON pay.invoice_id=i.id WHERE i.created_at::date BETWEEN ? AND ? AND i.due_date<CURRENT_DATE AND COALESCE(pay.paid,0)<i.total_cents",from,to)).reduce((n,x)=>n+x.balance_cents,0);
 const supplier_performance=await all("SELECT s.name supplier,COUNT(o.id) orders,ROUND(s.reliability::numeric,1) reliability_score FROM suppliers s LEFT JOIN purchase_orders o ON o.supplier_id=s.id AND o.status='RECEIVED' AND o.created_at::date BETWEEN ? AND ? GROUP BY s.id,s.name,s.reliability ORDER BY s.reliability DESC",from,to);
 return Response.json({from,to,sales,purchases,sales_count:sales.reduce((n,x)=>n+x.orders,0),purchase_count:purchases.reduce((n,x)=>n+x.orders,0),invoices,receivable_cents,overdue_cents,top_customers,top_products,estimated_margin_cents:Math.round(sales.reduce((n,x)=>n+x.total_cents,0)*.38),supplier_performance});
}
