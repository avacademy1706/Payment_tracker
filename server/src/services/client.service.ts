import mongoose from "mongoose";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { computeStatus, roundCurrency } from "./status.service";
import type { PaymentStatus } from "../../../shared/types/enums";

export interface ClientFinancialSummary {
  totalOutstanding: number;
  totalPaid: number;
  totalBilled: number;
  lastPaymentDate: Date | null;
  currentMonthStatus: PaymentStatus | null;
}

const EMPTY_SUMMARY: ClientFinancialSummary = {
  totalOutstanding: 0,
  totalPaid: 0,
  totalBilled: 0,
  lastPaymentDate: null,
  currentMonthStatus: null,
};

/**
 * Builds a financial summary per client for the given client ids.
 * Runs two aggregations (invoices + payments) rather than one combined
 * pipeline, since combining them would require duplicating documents
 * across joins and risks double counting.
 */
export async function getClientFinancialSummaries(
  clientIds: mongoose.Types.ObjectId[]
): Promise<Map<string, ClientFinancialSummary>> {
  const summaries = new Map<string, ClientFinancialSummary>();
  if (clientIds.length === 0) return summaries;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [invoiceAgg, lastPayments] = await Promise.all([
    Invoice.aggregate([
      { $match: { client: { $in: clientIds }, isArchived: false } },
      {
        $group: {
          _id: "$client",
          totalBilled: { $sum: "$amountDue" },
          totalPaid: { $sum: "$amountPaid" },
          totalOutstanding: { $sum: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { client: { $in: clientIds }, isVoided: false } },
      { $sort: { paymentDate: -1 } },
      { $group: { _id: "$client", lastPaymentDate: { $first: "$paymentDate" } } },
    ]),
  ]);

  const currentMonthInvoices = await Invoice.find({
    client: { $in: clientIds },
    billingMonth: currentMonth,
    isArchived: false,
  }).select("client amountDue amountPaid dueDate");

  for (const id of clientIds) {
    summaries.set(id.toString(), { ...EMPTY_SUMMARY });
  }

  for (const row of invoiceAgg) {
    summaries.set(row._id.toString(), {
      ...summaries.get(row._id.toString())!,
      totalBilled: roundCurrency(row.totalBilled),
      totalPaid: roundCurrency(row.totalPaid),
      totalOutstanding: roundCurrency(row.totalOutstanding),
    });
  }

  for (const row of lastPayments) {
    const key = row._id.toString();
    summaries.set(key, { ...summaries.get(key)!, lastPaymentDate: row.lastPaymentDate });
  }

  for (const inv of currentMonthInvoices) {
    const key = inv.client.toString();
    const status = computeStatus(inv.amountDue, inv.amountPaid, inv.dueDate, now);
    summaries.set(key, { ...summaries.get(key)!, currentMonthStatus: status });
  }

  return summaries;
}
