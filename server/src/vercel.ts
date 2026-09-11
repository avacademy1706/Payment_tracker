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
    })();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app(req, res);
}
