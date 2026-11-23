import { authError } from "@/lib/auth.mjs";
import { all, run } from "@/lib/db.mjs";
import { customerSchema, parseBody } from "@/lib/schemas.mjs";
export const runtime="nodejs";
export async function GET(request){const denied=await authError(request);if(denied)return denied;return Response.json(await all("SELECT * FROM customers ORDER BY name"));}
export async function POST(request){const denied=await authError(request,["ADMIN","SALES_MANAGER"]);if(denied)return denied;const parsed=parseBody(customerSchema,await request.json());if(parsed.error)return Response.json({error:parsed.error},{status:400});try{const b=parsed.data,r=await run("INSERT INTO customers(name,email,phone) VALUES(?,?,?)",b.name,b.email||null,b.phone||null);await run("INSERT INTO audit_log(action,entity,entity_id) VALUES('CREATE','Customer',?)",r.lastInsertRowid);return Response.json({id:r.lastInsertRowid,...b},{status:201});}catch{return Response.json({error:"Impossible de créer ce client."},{status:400});}}
