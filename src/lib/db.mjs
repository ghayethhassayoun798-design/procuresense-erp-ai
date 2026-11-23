import pg from "pg";
import { AsyncLocalStorage } from "node:async_hooks";
const { Pool } = pg;
const DATABASE_URL=process.env.DATABASE_URL;

pg.types.setTypeParser(20,value=>Number(value));
pg.types.setTypeParser(1700,value=>Number(value));
export const pool=new Pool({connectionString:DATABASE_URL||"postgresql://localhost/procuresense",max:8,idleTimeoutMillis:30000,connectionTimeoutMillis:5000});
const transactionContext=new AsyncLocalStorage();
function translate(sql){let text=sql.trim().replace(/;\s*$/g,"");text=text.replace(/date\('now','\+30 day'\)/gi,"(CURRENT_DATE + INTERVAL '30 days')").replace(/date\('now'\)/gi,"CURRENT_DATE").replace(/datetime\('now'\)/gi,"NOW()").replace(/strftime\('%Y-%m',\s*([\w.]+)\)/gi,"TO_CHAR($1, 'YYYY-MM')").replace(/date\(([\w.]+)\)/gi,"$1::date").replace(/GROUP_CONCAT\(([\s\S]*?),\s*('[^']*')\)/gi,"STRING_AGG($1, $2)").replace(/\bu\.active\s*=\s*1\b/gi,"u.active=TRUE").replace(/\bactive\s*=\s*1\b/gi,"active=TRUE");let n=0;text=text.replace(/\?/g,()=>`$${++n}`);return text;}
function executor(){return transactionContext.getStore()||pool;}
export async function all(sql,...args){const result=await executor().query(translate(sql),args);return result.rows;}
export async function one(sql,...args){const result=await executor().query(translate(sql),args);return result.rows[0];}
export async function run(sql,...args){let text=sql.trim().replace(/;\s*$/g,"");const ignore=/^INSERT\s+OR\s+IGNORE\s+INTO\s+/i.test(text);if(ignore)text=text.replace(/^INSERT\s+OR\s+IGNORE\s+INTO\s+/i,"INSERT INTO ");const target=text.match(/^INSERT\s+INTO\s+([\w"]+)/i)?.[1]?.replaceAll('"',"").toLowerCase();const needsId=!!target&&!['sessions','app_settings'].includes(target)&&/^INSERT\b/i.test(text)&&!(/\bON\s+CONFLICT\b/i.test(text));if(ignore)text+=" ON CONFLICT DO NOTHING";if(needsId)text+=" RETURNING id";const result=await executor().query(translate(text),args);return {lastInsertRowid:result.rows?.[0]?.id,changes:result.rowCount||0};}
export async function transaction(fn){const current=transactionContext.getStore();if(current)return fn();const client=await pool.connect();try{await client.query("BEGIN");return await transactionContext.run(client,async()=>{try{const value=await fn();await client.query("COMMIT");return value;}catch(error){await client.query("ROLLBACK");throw error;}});}finally{client.release();}}
export async function closeDb(){await pool.end();}
