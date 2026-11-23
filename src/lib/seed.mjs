import { closeDb, one } from "./db.mjs";
const counts=await Promise.all(["products","suppliers","customers"].map(async table=>(await one(`SELECT COUNT(*) n FROM ${table}`)).n));
console.log(`PostgreSQL ready: ${counts[0]} products, ${counts[1]} suppliers, ${counts[2]} customers.`);
if(counts[0]===0)console.log("Database is empty. Create the first administrator in the app; import any existing SQLite data with npm run db:import-sqlite.");
await closeDb();
