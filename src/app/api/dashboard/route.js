import { authError } from "@/lib/auth.mjs";
import { all, one } from "@/lib/db.mjs";
import { estimatedGrossMargin } from "@/lib/business.mjs";
export const runtime = "nodejs";
const isoDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00.000Z`).toISOString().slice(0,10)===s;
export async function GET(request){const denied=await authError(request);if(denied)return denied;const q=new URL(request.url).searchParams,from=q.get("from"),to=q.get("to");if((from&&!isoDate(from))||(to&&!isoDate(to))||(from&&to&&from>to))return Response.json({error:"Période invalide. Utilisez des dates ISO et vérifiez l’ordre."},{status:400});const where=from&&to?" AND created_at::date BETWEEN ? AND ?":"",args=from&&to?[from,to]:[];
 const sales=(await one(`SELECT COALESCE(SUM(total_cents),0) v FROM sales_orders WHERE status='CONFIRMED'${where}`,...args)).v;
 const purchases=(await one(`SELECT COALESCE(SUM(total_cents),0) v FROM purchase_orders WHERE status!='CANCELLED'${where}`,...args)).v;
 const receivable=(await one("SELECT COALESCE(SUM(GREATEST(0,i.total_cents-COALESCE(p.paid,0))),0) v FROM invoices i LEFT JOIN (SELECT invoice_id,SUM(amount_cents) paid FROM payments GROUP BY invoice_id) p ON p.invoice_id=i.id")).v;
 const overdue=(await one("SELECT COALESCE(SUM(GREATEST(0,i.total_cents-COALESCE(p.paid,0))),0) v FROM invoices i LEFT JOIN (SELECT invoice_id,SUM(amount_cents) paid FROM payments GROUP BY invoice_id) p ON p.invoice_id=i.id WHERE i.due_date<CURRENT_DATE AND COALESCE(p.paid,0)<i.total_cents")).v;
 const lowStock=await all("SELECT id,sku,name,stock,minimum FROM products WHERE active=TRUE AND stock<minimum ORDER BY stock ASC");
 const top=await all(`SELECT p.name,SUM(si.quantity) quantity FROM sales_items si JOIN products p ON p.id=si.product_id JOIN sales_orders o ON o.id=si.order_id WHERE o.status='CONFIRMED'${from&&to?" AND o.created_at::date BETWEEN ? AND ?":""} GROUP BY p.id,p.name ORDER BY quantity DESC LIMIT 5`,...args);
 const customers=await all(`SELECT c.name,SUM(o.total_cents) sales_cents,COUNT(o.id) orders FROM sales_orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='CONFIRMED'${from&&to?" AND o.created_at::date BETWEEN ? AND ?":""} GROUP BY c.id,c.name ORDER BY sales_cents DESC LIMIT 5`,...args);
 const trendSales=await all(`SELECT TO_CHAR(created_at,'YYYY-MM') AS "month",SUM(total_cents) total_cents FROM sales_orders WHERE status='CONFIRMED'${where} GROUP BY 1 ORDER BY 1`,...args);
 const trendPurchases=await all(`SELECT TO_CHAR(created_at,'YYYY-MM') AS "month",SUM(total_cents) total_cents FROM purchase_orders WHERE status!='CANCELLED'${where} GROUP BY 1 ORDER BY 1`,...args);
 const recent=await all("SELECT reference,status,total_cents,created_at,'vente' type FROM sales_orders UNION ALL SELECT reference,status,total_cents,created_at,'achat' type FROM purchase_orders ORDER BY created_at DESC LIMIT 8");
 return Response.json({from:from||null,to:to||null,sales_cents:sales,purchases_cents:purchases,estimated_margin_cents:estimatedGrossMargin(sales,.62),receivable_cents:receivable,overdue_cents:overdue,inventory_cents:(await one("SELECT COALESCE(SUM(price_cents*stock),0) v FROM products")).v,low_stock:lowStock,top_products:top,top_customers:customers,sales_trend:trendSales,purchase_trend:trendPurchases,recent});
}
