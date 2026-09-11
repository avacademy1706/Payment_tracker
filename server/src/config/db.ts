import mongoose from "mongoose";
import { env } from "./env";

let memoryServerHandle: { stop: () => Promise<unknown> } | null = null;

/**
 * Connects to MongoDB. If MONGODB_URI is not set (typical for local dev
 * without a MongoDB install), an in-memory MongoDB replica set is started
 * automatically so the app works out of the box — a single-member replica
 * set (rather than a standalone instance) so multi-document transactions
 * (used when recording payments) work identically to production. Production
 * deployments must set MONGODB_URI to a real database.
 */
export async function connectDatabase(): Promise<void> {
  let uri = env.mongodbUri;

  if (!uri) {
    if (env.isProduction) {
      throw new Error("MONGODB_URI must be set in production.");
    }
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, dbName: "payment_tracker" } });
    memoryServerHandle = replSet;
    uri = replSet.getUri();
    console.log("[db] MONGODB_URI not set — started an in-memory MongoDB replica set for local development.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] Connected to MongoDB (${env.isProduction ? "production" : "development"} mode).`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServerHandle) {
    await memoryServerHandle.stop();
    memoryServerHandle = null;
  }
}

/** True when connectDatabase() started its own throwaway in-memory MongoDB rather than using a configured MONGODB_URI. */
export function isUsingAutoProvisionedDatabase(): boolean {
  return memoryServerHandle !== null;
}
