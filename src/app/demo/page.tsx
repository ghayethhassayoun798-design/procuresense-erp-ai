"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./demo.css";

type Product = { sku:string; name:string; category:string; price:number; stock:number; min:number };
const products:Product[] = [
 {sku:"PAP-104",name:"Papier A4 recyclé",category:"Fournitures",price:8.9,stock:18,min:25},
 {sku:"CLA-208",name:"Classeur à levier",category:"Fournitures",price:4.6,stock:64,min:20},
 {sku:"CAF-315",name:"Café en grains",category:"Épicerie",price:23.5,stock:12,min:18},
 {sku:"EAU-401",name:"Eau minérale 1,5 L",category:"Boissons",price:1.2,stock:140,min:50},
 {sku:"NET-512",name:"Nettoyant multi-usage",category:"Entretien",price:6.4,stock:9,min:15},
 {sku:"STY-627",name:"Stylos bleus (lot de 10)",category:"Fournitures",price:3.8,stock:42,min:20},
];
const money=(n:number)=>new Intl.NumberFormat("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+" DT";
const sections=["Vue d’ensemble","Produits","Stock","Achats","Ventes","Factures","Fournisseurs","Clients"];
const demoRows:Record<string,{title:string;description:string;columns:string[];rows:string[][]}>={
 "Achats":{title:"Commandes d’achat récentes",description:"Exemples fictifs de suivi des commandes fournisseur.",columns:["RÉFÉRENCE","FOURNISSEUR","DATE","ARTICLES","MONTANT","ÉTAT"],rows:[["ACH-DÉMO-024","Fournitures du Nord","21 nov. 2026","Papier A4 · 40","356,00 DT","Réceptionné"],["ACH-DÉMO-023","Café & Services","18 nov. 2026","Café · 24","564,00 DT","Commandé"],["ACH-DÉMO-022","Hygiène Plus","12 nov. 2026","Nettoyant · 30","192,00 DT","Réceptionné"],["ACH-DÉMO-021","Fournitures du Nord","05 nov. 2026","Stylos · 50","190,00 DT","Réceptionné"]]},
 "Ventes":{title:"Commandes de vente récentes",description:"Exemples fictifs de ventes et de leur état.",columns:["RÉFÉRENCE","CLIENT","DATE","ARTICLES","MONTANT","ÉTAT"],rows:[["VTE-DÉMO-041","Bureau Central","22 nov. 2026","Classeur · 12","55,20 DT","Confirmée"],["VTE-DÉMO-040","Café des Jardins","20 nov. 2026","Café · 6","141,00 DT","Confirmée"],["VTE-DÉMO-039","École Horizon","17 nov. 2026","Papier A4 · 20","178,00 DT","En préparation"],["VTE-DÉMO-038","Bureau Central","11 nov. 2026","Stylos · 15","57,00 DT","Confirmée"]]},
 "Factures":{title:"Factures de démonstration",description:"Suivi des montants facturés, encaissés et restant à recevoir.",columns:["N° FACTURE","TYPE","TIERS","ÉMISE LE","ÉCHÉANCE","TOTAL","ÉTAT"],rows:[["FAC-DÉMO-018","Vente","Bureau Central","22 nov. 2026","06 déc. 2026","55,20 DT","Payée"],["FAC-DÉMO-017","Vente","École Horizon","17 nov. 2026","01 déc. 2026","178,00 DT","À recevoir"],["FAC-DÉMO-016","Achat","Café & Services","18 nov. 2026","18 déc. 2026","564,00 DT","À payer"],["FAC-DÉMO-015","Vente","Café des Jardins","11 nov. 2026","25 nov. 2026","141,00 DT","En retard"]]},
 "Fournisseurs":{title:"Fournisseurs fictifs",description:"Exemples de partenaires et d’indicateurs de suivi.",columns:["FOURNISSEUR","SPÉCIALITÉ","COMMANDES","FIABILITÉ","DÉLAI MOYEN","ÉTAT"],rows:[["Fournitures du Nord","Papeterie","12","96 %","3 jours","Actif"],["Café & Services","Épicerie","8","92 %","4 jours","Actif"],["Hygiène Plus","Entretien","6","89 %","5 jours","Actif"]]},
 "Clients":{title:"Clients fictifs",description:"Exemples de comptes clients et d’activité commerciale.",columns:["CLIENT","SEGMENT","COMMANDES","ACHATS CUMULÉS","DERNIÈRE COMMANDE","ÉTAT"],rows:[["Bureau Central","Professionnel","14","2 460,00 DT","22 nov. 2026","Actif"],["École Horizon","Éducation","9","1 820,00 DT","17 nov. 2026","Actif"],["Café des Jardins","Commerce","7","1 145,00 DT","20 nov. 2026","Actif"]]},
};
export default function DemoPage(){
 const [section,setSection]=useState(sections[0]);
 const [search,setSearch]=useState("");
 const visible=useMemo(()=>products.filter(p=>`${p.sku} ${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())),[search]);
 const low=products.filter(p=>p.stock<=p.min);
 return <main className="demo-shell">
  <div className="demo-banner"><span><b>MODE DÉMO</b> Données entièrement fictives · Lecture seule</span><Link href="/admin">Espace administrateur <span aria-hidden>↗</span></Link></div>
  <div className="demo-frame">
   <aside className="demo-side"><div className="demo-brand"><span className="demo-logo">P</span><span><b>ProcureSense</b><small>ERP · PILOTAGE</small></span></div><div className="demo-group">GESTION</div>
    {sections.map((item,i)=><button key={item} className={`demo-nav ${section===item?"selected":""}`} onClick={()=>setSection(item)}><span>{["◫","▦","▤","⇣","⇡","▧","♧","♙"][i]}</span>{item}</button>)}
    <div className="demo-side-note"><span className="demo-pulse"/> Démonstration publique</div>
   </aside>
   <section className="demo-main"><header className="demo-header"><div><span>ESPACE DE DÉMONSTRATION</span><h1>{section}</h1></div><div className="demo-header-right"><span className="demo-readonly">◉ Lecture seule</span><span className="demo-avatar">PS</span></div></header>
    {section==="Vue d’ensemble"?<div className="demo-content">
      <div className="demo-welcome"><div><span className="demo-kicker">PROCURESENSE ERP · DÉMO INTERACTIVE</span><h2>Une vision claire des opérations.</h2><p>Achats, ventes et stock réunis dans un seul espace de pilotage.</p></div><div className="demo-date">PÉRIODE DE DÉMONSTRATION<br/><b>Novembre 2026</b></div></div>
      <div className="demo-metrics"><Metric label="Chiffre d’affaires" value="12 480,00 DT" foot="Ventes confirmées · démo" color="blue"/><Metric label="Achats enregistrés" value="8 235,50 DT" foot="Commandes reçues · démo" color="green"/><Metric label="Marge estimée" value="4 244,50 DT" foot="Indicateur de démonstration" color="amber"/><Metric label="Alertes de stock" value={String(low.length)} foot="Produits sous le seuil" color="rose"/></div>
      <div className="demo-grid"><section className="demo-card demo-chart-card"><div className="demo-card-head"><div><h3>Activité mensuelle</h3><p>Exemple de suivi des ventes et des achats</p></div><div className="demo-legend"><span><i className="blue-dot"/>Ventes</span><span><i className="green-dot"/>Achats</span></div></div><div className="demo-chart">{[[32,23],[48,31],[43,28],[64,45],[78,52],[58,38]].map((v,i)=><div className="demo-month" key={i}><div className="demo-bars"><span style={{height:`${v[0]}%`}}/><span style={{height:`${v[1]}%`}}/></div><small>{["Juin","Juil.","Août","Sept.","Oct.","Nov."][i]}</small></div>)}</div></section>
       <section className="demo-card demo-alert-card"><div className="demo-card-head"><div><h3>À surveiller</h3><p>Seuil de stock atteint ou dépassé</p></div><span className="demo-count">{low.length}</span></div>{low.map(p=><div className="demo-alert" key={p.sku}><span className="alert-icon">!</span><span><b>{p.name}</b><small>{p.sku} · seuil {p.min}</small></span><strong>{p.stock} unités</strong></div>)}<button className="demo-text-button" onClick={()=>setSection("Stock")}>Voir le stock <span>→</span></button></section></div>
      <section className="demo-card demo-products"><div className="demo-card-head"><div><h3>État du stock</h3><p>Extrait des produits de démonstration</p></div><button className="demo-outline" onClick={()=>setSection("Produits")}>Voir les produits →</button></div><ProductTable data={products.slice(0,4)}/></section>
      <p className="demo-disclaimer">Toutes les données affichées sont fictives et servent uniquement à présenter les fonctionnalités. Aucune donnée de l’entreprise ni action réelle n’est utilisée ici.</p>
    </div>:<div className="demo-content"><section className="demo-card demo-section-card"><div className="demo-card-head"><div><span className="demo-kicker">APERÇU FICTIF · LECTURE SEULE</span><h3>{demoRows[section]?.title||section}</h3><p>{demoRows[section]?.description||"Extrait du catalogue de démonstration."}</p></div></div>{section==="Produits"||section==="Stock"?<><div className="demo-toolbar"><span>{visible.length} produits présentés</span><input aria-label="Rechercher" placeholder="Rechercher un produit…" value={search} onChange={e=>setSearch(e.target.value)}/></div><ProductTable data={visible}/></>:demoRows[section]?<DemoTable columns={demoRows[section].columns} rows={demoRows[section].rows}/>:null}</section><p className="demo-disclaimer">Mode lecture seule · données synthétiques · aucune connexion à la base de production.</p></div>}
    <footer className="demo-footer"><span>ProcureSense ERP · Système d’information de gestion</span><span>Démonstration publique · 2026</span></footer>
   </section>
  </div>
 </main>
}
function Metric({label,value,foot,color}:{label:string,value:string,foot:string,color:string}){return <div className={`demo-metric ${color}`}><span>{label}</span><b>{value}</b><small>{foot}</small></div>}
function ProductTable({data}:{data:Product[]}){return <div className="demo-table-wrap"><table className="demo-table"><thead><tr><th>SKU</th><th>PRODUIT</th><th>CATÉGORIE</th><th>PRIX UNITAIRE</th><th>STOCK</th><th>SEUIL</th><th>ÉTAT</th></tr></thead><tbody>{data.map(p=><tr key={p.sku}><td className="sku-cell">{p.sku}</td><td><b>{p.name}</b></td><td>{p.category}</td><td>{money(p.price)}</td><td>{p.stock}</td><td>{p.min}</td><td><span className={`demo-status ${p.stock<=p.min?"warning":"ok"}`}>{p.stock<=p.min?"À réapprovisionner":"Disponible"}</span></td></tr>)}{!data.length&&<tr><td colSpan={7} className="demo-no-results">Aucun produit trouvé.</td></tr>}</tbody></table></div>}
function DemoTable({columns,rows}:{columns:string[];rows:string[][]}){return <div className="demo-table-wrap"><table className="demo-table"><thead><tr>{columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row[0]}>{row.map((cell,index)=><td key={`${row[0]}-${index}`}>{index===0?<b className="sku-cell">{cell}</b>:<span className={/Confirmée|Réceptionné|Payée|Actif/i.test(cell)?"demo-status ok":/retard|recevoir|payer|préparation|Commandé/i.test(cell)?"demo-status warning":""}>{cell}</span>}</td>)}</tr>)}</tbody></table></div>}

