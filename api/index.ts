// Vercel serverless entry point. Vercel treats any exported request handler
// under /api as a function — an Express app already satisfies that
// signature, so it's exported directly (no @vercel/node adapter needed).
//
// Top-level await connects to MongoDB and bootstraps the admin login once
// per cold start; Vercel then reuses this same module (and its already-open
// connection) for every subsequent warm invocation of that function
// instance — see connectDatabase()'s idempotency guard in config/db.ts.
import { createApp } from "../server/src/app";
import { connectDatabase } from "../server/src/config/db";
import { bootstrapEssentials } from "../server/src/seed/bootstrap";

await connectDatabase();
await bootstrapEssentials();

const app = createApp();

export default app;
