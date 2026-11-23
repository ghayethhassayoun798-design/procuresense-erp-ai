import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const config: NextConfig = { outputFileTracingRoot: root, distDir: "release-final", experimental: { cpus: 1 } };
export default config;
