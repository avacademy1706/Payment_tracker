import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { bootstrapEssentials } from "./seed/bootstrap";

// Classic serverless "warm invocation" cache: this module-level promise is
// created once per cold start and reused by every subsequent request that
// lands on the same warm function instance, so the DB only connects once.
let appPromise: Promise<ReturnType<typeof createApp>> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      await connectDatabase();
      await bootstrapEssentials();
      return createApp();
    })().catch((err) => {
      // Don't cache a failed startup — a transient issue (e.g. Atlas still
      // spinning up, a momentary network blip) would otherwise permanently
      // break every request this warm container ever handles again.
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err) {
    // Startup failed before the Express app (and its own error middleware)
    // even existed — most likely MONGODB_URI missing/wrong or Atlas
    // unreachable. Surface the message so it's visible without digging
    // through Vercel's function logs; full details are still logged there.
    console.error("[vercel] Failed to initialize app:", err);
    const message = err instanceof Error ? err.message : "Unknown startup error";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: `Server failed to start: ${message}` }));
  }
}
