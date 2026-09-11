import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { User } from "../models/User";
import { Settings } from "../models/Settings";

/**
 * Idempotent startup bootstrap: ensures there's an admin login and a
 * business settings document, and nothing else. Safe to call on every
 * server start against any database (dev or production) — it only ever
 * creates what's missing, and never touches Clients/Invoices/Payments.
 * Loading demo business data is a separate, explicit action (`npm run seed`).
 */
export async function bootstrapEssentials(): Promise<void> {
  const existingUser = await User.findOne({});
  if (!existingUser) {
    const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12);
    await User.create({
      name: env.seedAdminName,
      email: env.seedAdminEmail.toLowerCase(),
      passwordHash,
      role: "admin",
    });
  }

  const existingSettings = await Settings.findOne({});
  if (!existingSettings) {
    await Settings.create({});
  }
}
