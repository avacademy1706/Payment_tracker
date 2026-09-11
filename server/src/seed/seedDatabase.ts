import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { User } from "../models/User";
import { Client } from "../models/Client";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { Counter } from "../models/Counter";
import { Settings } from "../models/Settings";
import { generateClientId } from "../services/clientId.service";
import { generateInvoiceNumber } from "../services/invoiceNumber.service";
import { computeDueDate, computeInvoiceDate, recalculateInvoice } from "../services/invoice.service";
import {
  SEED_CLIENTS,
  PAYMENT_MODE_ROTATION,
  CURRENT_MONTH_PATTERN,
  HISTORICAL_PARTIAL_MONTH_OFFSET,
} from "./seedData";

const MONTHS_OF_HISTORY = 6; // includes the current month

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthsAgo(n: number, from: Date = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() - n, 1);
}

export interface SeedSummary {
  clients: number;
  invoices: number;
  payments: number;
}

/**
 * Wipes and repopulates the connected database with realistic demo data.
 * Shared by the standalone `npm run seed` CLI and by server.ts, which
 * calls this automatically on startup when running against the
 * auto-provisioned in-memory dev database (see config/db.ts) so the app
 * has data to show without a separate manual step.
 */
export async function seedDatabase(): Promise<SeedSummary> {
  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    Counter.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12);
  await User.create({
    name: env.seedAdminName,
    email: env.seedAdminEmail.toLowerCase(),
    passwordHash,
    role: "admin",
  });

  await Settings.create({
    businessName: "Nexora Consulting Services",
    businessEmail: "billing@nexoraconsulting.in",
    businessPhone: "+91 98200 11223",
    businessAddress: "402, Prestige Towers, MG Road, Bengaluru, Karnataka 560001",
    gstNumber: "29ABCDE1234F1Z5",
    currency: "INR",
    defaultPaymentTerms: "Payment due within 5 days of invoice date.",
    defaultDueDay: 5,
  });

  const now = new Date();
  let paymentModeCursor = 0;
  let invoiceCount = 0;
  let paymentCount = 0;

  for (let i = 0; i < SEED_CLIENTS.length; i++) {
    const def = SEED_CLIENTS[i];
    const clientId = await generateClientId();
    const client = await Client.create({ ...def, clientId, isActive: true });

    for (let m = MONTHS_OF_HISTORY - 1; m >= 0; m--) {
      const billingMonthDate = monthsAgo(m, now);
      const billingMonth = monthKey(billingMonthDate);
      const invoiceDate = computeInvoiceDate(billingMonth);
      const dueDate = computeDueDate(billingMonth, client.defaultDueDay);
      const invoiceNumber = await generateInvoiceNumber(invoiceDate);

      const invoice = await Invoice.create({
        invoiceNumber,
        client: client._id,
        billingMonth,
        invoiceDate,
        dueDate,
        amountDue: client.monthlyFee,
        amountPaid: 0,
        notes: "",
      });
      invoiceCount++;

      const isCurrentMonth = m === 0;
      const historicalPartialOffset = HISTORICAL_PARTIAL_MONTH_OFFSET[i];
      const isDesignatedHistoricalPartial = !isCurrentMonth && historicalPartialOffset === m;

      let behaviour: "full" | "partial" | "none";
      if (isCurrentMonth) {
        behaviour = CURRENT_MONTH_PATTERN[i];
      } else if (isDesignatedHistoricalPartial) {
        behaviour = "partial";
      } else {
        behaviour = "full";
      }

      if (behaviour === "none") continue;

      const amount = behaviour === "full" ? client.monthlyFee : Math.round(client.monthlyFee * 0.6);
      const paymentDate = new Date(dueDate.getTime() - (behaviour === "full" ? 2 : -1) * 86400000);
      const paymentMode = PAYMENT_MODE_ROTATION[paymentModeCursor % PAYMENT_MODE_ROTATION.length];
      paymentModeCursor++;

      await Payment.create({
        invoice: invoice._id,
        client: client._id,
        amount,
        paymentDate,
        paymentMode,
        transactionReference: `TXN${String(invoiceCount).padStart(6, "0")}`,
        remarks: behaviour === "partial" ? "Partial payment received; balance pending." : "",
      });
      paymentCount++;

      await recalculateInvoice(invoice._id);
    }
  }

  return { clients: SEED_CLIENTS.length, invoices: invoiceCount, payments: paymentCount };
}
