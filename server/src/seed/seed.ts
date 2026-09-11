import { connectDatabase, disconnectDatabase } from "../config/db";
import { env } from "../config/env";
import { seedDatabase } from "./seedDatabase";

async function run() {
  await connectDatabase();
  console.log("[seed] Connected. Clearing existing data and loading demo data...");

  const summary = await seedDatabase();

  console.log(`[seed] Created ${summary.clients} clients, ${summary.invoices} invoices, ${summary.payments} payments.`);
  console.log("[seed] Done.");
  console.log("");
  console.log("Demo login:");
  console.log(`  email:    ${env.seedAdminEmail}`);
  console.log(`  password: ${env.seedAdminPassword}`);

  await disconnectDatabase();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
