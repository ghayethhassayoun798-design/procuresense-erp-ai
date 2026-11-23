import { authError } from "@/lib/auth.mjs";
import { all, run } from "@/lib/db.mjs";
import { parseBody, settingsSchema } from "@/lib/schemas.mjs";
export const runtime="nodejs";
export async function GET(request){const denied=await authError(request,["ADMIN"]);if(denied)return denied;const rows=await all('SELECT "key","value" FROM app_settings');return Response.json(Object.fromEntries(rows.map(x=>[x.key,x.value])));}
export async function POST(request){const denied=await authError(request,["ADMIN"]);if(denied)return denied;const parsed=parseBody(settingsSchema,await request.json());if(parsed.error)return Response.json({error:parsed.error},{status:400});const value=String(parsed.data.tax_rate);await run('INSERT INTO app_settings("key","value") VALUES(\'tax_rate\',?) ON CONFLICT("key") DO UPDATE SET "value"=EXCLUDED."value"',value);await run("INSERT INTO audit_log(action,entity,entity_id) VALUES('UPDATE_SETTING','AppSetting',NULL)");return Response.json({tax_rate:value});}
