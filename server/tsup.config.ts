import { defineConfig } from "tsup";

export default defineConfig({
  entry: { server: "src/server.ts" },
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  splitting: false,
  sourcemap: true,
  clean: true,
  // mongodb-memory-server is only ever reached via a dynamic import gated
  // behind `!env.isProduction` (see config/db.ts) — it's a devDependency
  // on purpose and must stay external rather than bundled.
  external: ["mongodb-memory-server"],
});
