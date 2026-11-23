import { authError } from "@/lib/auth.mjs";
import { all, run } from "@/lib/db.mjs";
import { categorySchema, parseBody } from "@/lib/schemas.mjs";
export const runtime="nodejs";
export async function GET(request){const denied=await authError(request);if(denied)return denied;return Response.json(await all("SELECT c.id,c.name,COUNT(p.id)::int product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.name"));}
export async function POST(request){const denied=await authError(request,["ADMIN","STOCK_MANAGER"]);if(denied)return denied;const parsed=parseBody(categorySchema,await request.json());if(parsed.error)return Response.json({error:parsed.error},{status:400});try{const r=await run("INSERT INTO categories(name) VALUES(?)",parsed.data.name);await run("INSERT INTO audit_log(action,entity,entity_id) VALUES('CREATE','Category',?)",r.lastInsertRowid);return Response.json({id:r.lastInsertRowid,name:parsed.data.name,product_count:0},{status:201});}catch{return Response.json({error:"Cette catégorie existe déjà."},{status:409});}}
