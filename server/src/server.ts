import { createApp } from "./app";
import { connectDatabase, disconnectDatabase, isUsingAutoProvisionedDatabase } from "./config/db";
import { env } from "./config/env";
import { bootstrapEssentials } from "./seed/bootstrap";

async function main() {
  await connectDatabase();

  // Ensures a login and a business settings document exist — nothing more.
  // Safe to run against any database: it only creates what's missing and
  // never touches Clients/Invoices/Payments. Demo business data is only
  // ever loaded by explicitly running `npm run seed`.
  await bootstrapEssentials();
  if (isUsingAutoProvisionedDatabase()) {
    console.log(`[server] Auto-provisioned dev database ready. Login: ${env.seedAdminEmail} / ${env.seedAdminPassword}`);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] Listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
