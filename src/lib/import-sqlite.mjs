import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import path from "node:path";
const sourcePath=path.join(process.cwd(),"data","procuresense.db");
const source=new DatabaseSync(sourcePath,{readOnly:true});
const target=new Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:10000});
console.log("Connecting PostgreSQL importer...");
const client=await target.connect();
const tables=["users","categories","suppliers","customers","products","sessions","supplier_offers","stock_movements","purchase_requests","purchase_request_items","purchase_orders","purchase_items","sales_orders","sales_items","invoices","invoice_items","payments","app_settings","audit_log"];
const boolColumns={users:["active"],products:["active"]};
const monetaryColumns=new Set(["price_cents","unit_price_cents","total_cents","amount_cents"]);
try{
  await client.query("BEGIN");
  for(const table of tables){
    const columns=source.prepare(`PRAGMA table_info("${table}")`).all().map(x=>x.name);
    if(!columns.length)continue;
    console.log(`Reading ${table}...`);
    const rows=source.prepare(`SELECT * FROM "${table}"`).all();
    for(const row of rows){
      const values=columns.map(column=>monetaryColumns.has(column)?Number(row[column])*10:boolColumns[table]?.includes(column)?Boolean(row[column]):row[column]);
      const placeholders=values.map((_,i)=>`$${i+1}`).join(",");
      const quoted=columns.map(column=>`"${column}"`).join(",");
      await client.query(`INSERT INTO "${table}" (${quoted}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,values);
    }
    if(rows.length)console.log(`Imported ${rows.length} ${table}.`);
  }
  for(const table of tables){
    if(["sessions","app_settings"].includes(table))continue;
    await client.query(`SELECT setval(pg_get_serial_sequence('"${table}"','id'),COALESCE((SELECT MAX(id) FROM "${table}"),1),EXISTS(SELECT 1 FROM "${table}"))`);
  }
  await client.query("COMMIT");
  console.log(`SQLite records imported into PostgreSQL from ${sourcePath}.`);
}catch(error){await client.query("ROLLBACK");throw error;}
finally{client.release();source.close();await target.end();}
