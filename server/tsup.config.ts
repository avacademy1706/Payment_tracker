import { defineConfig } from "tsup";

export default defineConfig([
  {
    // Standalone server for any regular Node host: `npm start` -> node dist/server.js.
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
  },
  {
    // Vercel serverless function. Bundled into ONE self-contained CommonJS
    // file (no remaining local relative imports) rather than left for
    // Vercel's own per-file Node builder to trace — that builder does not
    // reliably resolve this project's extensionless relative imports across
    // multiple files, which surfaces at runtime as
    // "Cannot find module '/var/task/server/src/app'". Output goes straight
    // to ../api/index.js (the repo-root /api folder Vercel deploys from) —
    // that file is committed to git; rebuild and re-commit it whenever
    // server/src/** or shared/** changes and you're deploying to Vercel.
    entry: { index: "src/vercel.ts" },
    format: ["cjs"],
    target: "node20",
    platform: "node",
    outDir: "../api",
    // The repo root's package.json declares "type": "module", which would
    // make Node treat a plain api/index.js as an ES module and choke on
    // this CommonJS bundle's `require`/`module.exports`. The .cjs extension
    // forces CommonJS regardless of that setting; Vercel's Node builder
    // supports it as a function entry the same as .js.
    outExtension: () => ({ js: ".cjs" }),
    splitting: false,
    sourcemap: false,
    clean: false,
    external: ["mongodb-memory-server"],
  },
]);
