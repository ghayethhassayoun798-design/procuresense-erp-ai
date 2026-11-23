import { authError, passwordHash } from "@/lib/auth.mjs";
import { all, run } from "@/lib/db.mjs";
import { parseBody, userCreateSchema } from "@/lib/schemas.mjs";
export const runtime="nodejs";
export async function GET(request){const denied=await authError(request,["ADMIN"]);if(denied)return denied;return Response.json(await all("SELECT id,name,email,role,active,created_at FROM users ORDER BY name"));}
export async function POST(request){const denied=await authError(request,["ADMIN"]);if(denied)return denied;try{const parsed=parseBody(userCreateSchema,await request.json());if(parsed.error)return Response.json({error:parsed.error},{status:400});const b=parsed.data,out=await run("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",b.name,b.email,passwordHash(b.password),b.role);await run("INSERT INTO audit_log(action,entity,entity_id) VALUES('CREATE','User',?)",out.lastInsertRowid);return Response.json({id:out.lastInsertRowid,name:b.name,email:b.email,role:b.role,active:1},{status:201});}catch{return Response.json({error:"Email peut-être déjà utilisé."},{status:409});}}
