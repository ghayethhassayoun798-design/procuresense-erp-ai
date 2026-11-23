/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import BiTrendChart from "@/components/BiTrendChart";
const euro=(c:number)=>new Intl.NumberFormat("fr-FR",{minimumFractionDigits:3,maximumFractionDigits:3}).format((c||0)/1000)+" DT";
const dateValue=(date:Date)=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
export default function ReportPanel(){
 const now=new Date(),today=dateValue(now),six=new Date(now.getFullYear(),now.getMonth()-5,1);
 const [from,setFrom]=useState(dateValue(six)),[to,setTo]=useState(today),[data,setData]=useState<any>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function load(){if(from>to){setError("La date de début doit précéder la date de fin.");return;}setBusy(true);try{const r=await fetch("/api/reports?from="+from+"&to="+to),d=await r.json();if(!r.ok){setError(d.error);return;}setData(d);setError("");}catch{setError("Impossible de charger le rapport.");}finally{setBusy(false);}}
 useEffect(()=>{void load()},[]);
 const trend=[...(data?.sales||[]).map((x:any)=>({...x,type:"Vente"})),...(data?.purchases||[]).map((x:any)=>({...x,type:"Achat"}))].sort((a:any,b:any)=>a.day.localeCompare(b.day));
 return <section className="panel"><div className="tablehead"><div><h2>Rapport ventes, achats et factures</h2><p>Transactions de la base locale pour la période choisie.</p></div><div className="date-filter"><label>Du <input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Au <input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><button disabled={busy} onClick={()=>void load()}>{busy?"Chargement…":"Appliquer"}</button></div></div>{error&&<p className="notice">{error}</p>}{data&&<><div className="metrics compact">{[["Ventes",euro(data.sales.reduce((n:number,x:any)=>n+x.total_cents,0))],["Achats",euro(data.purchases.reduce((n:number,x:any)=>n+x.total_cents,0))],["Marge estimée",euro(data.estimated_margin_cents)],["Créances ouvertes",euro(data.receivable_cents)],["Factures en retard",euro(data.overdue_cents)],["Commandes",data.sales_count+data.purchase_count]].map(([k,v])=><div className="metric" key={String(k)}><small>{k}</small><strong>{v}</strong></div>)}</div><BiTrendChart sales={data.sales} purchases={data.purchases}/><h3>Transactions par jour</h3><DataTable data={trend}/><h3>État des factures</h3><DataTable data={data.invoices}/><h3>Meilleurs clients</h3><DataTable data={data.top_customers}/><h3>Produits les plus vendus</h3><DataTable data={data.top_products}/><h3>Performance fournisseurs</h3><DataTable data={data.supplier_performance}/></>}</section>;
}
function DataTable({data}:{data:any[]}){const keys=Object.keys(data[0]||{}).filter(k=>k!=="id").slice(0,6);return <div className="scroll"><table><thead><tr>{keys.map(k=><th key={k}>{k.endsWith("_cents")?`${k.slice(0,-6)} (DT)`:k.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{data.map((r,i)=><tr key={`${r.id??r.day??"row"}-${r.type??"item"}-${i}`}>{keys.map(k=><td key={k}>{typeof r[k]==="number"&&k.includes("cents")?euro(r[k]):String(r[k]??"—")}</td>)}</tr>)}{!data.length&&<tr><td colSpan={Math.max(1,keys.length)}>Aucune donnée pour cette période.</td></tr>}</tbody></table></div>}

