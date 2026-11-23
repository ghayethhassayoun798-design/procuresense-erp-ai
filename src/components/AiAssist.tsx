import { useState } from "react";
type Row=Record<string,unknown>;
type Explanation={mode?:string;explanation?:string;error?:string};
export default function AiAssist({section,data}:{section:string;data:Row[]}){
 const [result,setResult]=useState<Explanation|null>(null),[busy,setBusy]=useState(false);
 async function explain(){setBusy(true);setResult(null);try{const kind=section==="Recommandations"?"replenishment":"supplier-comparison",productIds=[...new Set(data.map(x=>Number(x.product_id??x.id)).filter(Boolean))].slice(0,10),response=await fetch("/api/ai/explain",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,productIds})}),value=await response.json() as Explanation;setResult(response.ok?value:{error:value.error||"Résumé indisponible."});}catch{setResult({error:"Résumé indisponible."});}finally{setBusy(false);}}
 return <div className="ai-assist"><div><b>Résumé assisté facultatif</b><small>Au clic, jusqu’à 10 produits et indicateurs sont envoyés au service configuré côté serveur; sans clé, le résumé reste local.</small></div><button disabled={busy||!data.length} onClick={explain}>{busy?"Résumé en cours…":"Créer un résumé explicatif"}</button>{result&&<div className="ai-result"><b>{result.mode==="AI_API"?"Modèle IA actif":"Mode règles locales"}</b><p>{result.explanation||result.error}</p></div>}</div>;
}
