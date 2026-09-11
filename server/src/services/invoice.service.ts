import mongoose from "mongoose";
import { Invoice, type InvoiceDocument } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { computeStatus, roundCurrency } from "./status.service";
import { ApiError } from "../utils/ApiError";

/**
 * Adds the derived `balance` and `status` fields to a plain invoice object
 * (from `.toObject()`/`.lean()`/an aggregation stage). Used by every
 * endpoint that serializes an invoice so the badge shown in the client
 * profile, the invoices list, and payment pickers can never disagree.
 */
export function withInvoiceComputedFields<T extends { amountDue: number; amountPaid: number; dueDate: Date | string }>(
  invoice: T,
  now: Date = new Date()
): T & { balance: number; status: ReturnType<typeof computeStatus> } {
  const balance = Math.max(0, roundCurrency(invoice.amountDue - invoice.amountPaid));
  const status = computeStatus(invoice.amountDue, invoice.amountPaid, new Date(invoice.dueDate), now);
  return { ...invoice, balance, status };
}

/**
 * Recomputes an invoice's cached `amountPaid` from the sum of its
 * non-voided payments. This is the ONLY place amountPaid is written —
 * it is always derived, never accepted directly from client input.
 * Call this inside the same transaction/session as any payment mutation.
 */
export async function recalculateInvoice(
  invoiceId: mongoose.Types.ObjectId | string,
  session?: mongoose.ClientSession
): Promise<InvoiceDocument> {
  const [agg] = await Payment.aggregate([
    { $match: { invoice: new mongoose.Types.ObjectId(invoiceId), isVoided: false } },
    { $group: { _id: "$invoice", total: { $sum: "$amount" } } },
  ]).session(session ?? null);

  const amountPaid = roundCurrency(agg?.total ?? 0);

  const invoice = await Invoice.findByIdAndUpdate(
    invoiceId,
    { $set: { amountPaid } },
    { new: true, session }
  );

  if (!invoice) {
    throw new ApiError(404, "Invoice not found while recalculating balance.");
  }

  return invoice;
}

/**
 * Due date for a given billing month + client billing day, e.g. 2026-09 +
 * day 5 -> Sep 5 2026. Constructed at UTC midnight (not local midnight) so
 * this "calendar date" is unambiguous regardless of the server's timezone —
 * see the note in status.service.ts above isPastDueDate/daysUntilDue.
 */
export function computeDueDate(billingMonth: string, billingDay: number): Date {
  const [year, month] = billingMonth.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(billingDay, daysInMonth);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function computeInvoiceDate(billingMonth: string): Date {
  const [year, month] = billingMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

export function isValidBillingMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function startOfToday(now: Date = new Date()): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/**
 * Builds a Mongo aggregation $match stage for a status filter. Assumes a
 * preceding stage has already computed `balance = max(amountDue - amountPaid, 0)`.
 * Mirrors the priority rules in status.service.ts#computeStatus exactly so
 * filtered lists never disagree with the status badge shown per row.
 */
export function statusMatchStage(status: string, now: Date = new Date()): Record<string, unknown> | null {
  const today = startOfToday(now);

  switch (status) {
    case "Paid":
      return { balance: { $lte: 0 } };
    case "Overdue":
      return { balance: { $gt: 0 }, dueDate: { $lt: today } };
    case "Partial":
      return { balance: { $gt: 0 }, amountPaid: { $gt: 0 }, dueDate: { $gte: today } };
    case "Pending":
      return { balance: { $gt: 0 }, amountPaid: { $lte: 0 }, dueDate: { $gte: today } };
    default:
      return null;
  }
}

export const SORT_STAGES: Record<string, Record<string, 1 | -1>> = {
  newest: { invoiceDate: -1, createdAt: -1 },
  oldest: { invoiceDate: 1, createdAt: 1 },
  balanceHigh: { balance: -1 },
  balanceLow: { balance: 1 },
  dueDate: { dueDate: 1 },
};
