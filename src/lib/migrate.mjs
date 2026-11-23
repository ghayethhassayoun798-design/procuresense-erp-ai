import { execSync } from "node:child_process";
const root=process.cwd();
if(!process.env.DATABASE_URL?.startsWith("postgresql://"))throw new Error("Configurez DATABASE_URL pour PostgreSQL dans .env.");
execSync("npx prisma migrate deploy --schema prisma/schema.prisma",{cwd:root,stdio:"inherit"});
