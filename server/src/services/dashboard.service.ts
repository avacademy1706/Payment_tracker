import { Client } from "../models/Client";
import { Invoice } from "../models/Invoice";
import { roundCurrency } from "./status.service";
import { startOfToday } from "./invoice.service";
import type {
  DashboardResponse,
  DashboardSummary,
  MonthlyRevenuePoint,
  StatusBreakdownPoint,
  OutstandingClientPoint,
} from "../../../shared/types/dashboard";

export type DashboardPeriod = "currentMonth" | "previousMonth" | "currentYear" | "custom";

export interface DashboardFilter {
  period: DashboardPeriod;
  dateFrom?: Date;
  dateTo?: Date;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function periodMatch(filter: DashboardFilter, now: Date): Record<string, unknown> {
  const currentKey = monthKey(now);

  switch (filter.period) {
    case "currentMonth":
      return { billingMonth: currentKey };
    case "previousMonth": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { billingMonth: monthKey(prev) };
    }
    case "currentYear":
      return { billingMonth: { $regex: `^${now.getFullYear()}-` } };
    case "custom":
      return {
        invoiceDate: {
          ...(filter.dateFrom ? { $gte: filter.dateFrom } : {}),
          ...(filter.dateTo ? { $lte: filter.dateTo } : {}),
        },
      };
    default:
      return {};
  }
}

export async function getDashboard(filter: DashboardFilter): Promise<DashboardResponse> {
  const now = new Date();
  const today = startOfToday(now);
  const match = { isArchived: false, ...periodMatch(filter, now) };

  const [clientCounts, statusAgg, monthlyAgg, topOutstandingAgg, dueSoonAgg] = await Promise.all([
    Client.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } },
    ]),
    Invoice.aggregate([
      { $match: match },
      { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
      {
        $addFields: {
          computedStatus: {
            $switch: {
              branches: [
                { case: { $lte: ["$balance", 0] }, then: "Paid" },
                { case: { $lt: ["$dueDate", today] }, then: "Overdue" },
                { case: { $gt: ["$amountPaid", 0] }, then: "Partial" },
              ],
              default: "Pending",
            },
          },
        },
      },
      {
        $group: {
          _id: "$computedStatus",
          count: { $sum: 1 },
          amount: { $sum: "$balance" },
          amountDue: { $sum: "$amountDue" },
          amountPaid: { $sum: "$amountPaid" },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: "$billingMonth", expected: { $sum: "$amountDue" }, collected: { $sum: "$amountPaid" } } },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]),
    Invoice.aggregate([
      { $match: { isArchived: false } },
      { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
      { $match: { balance: { $gt: 0 } } },
      { $group: { _id: "$client", outstanding: { $sum: "$balance" } } },
      { $sort: { outstanding: -1 } },
      { $limit: 5 },
      { $lookup: { from: "clients", localField: "_id", foreignField: "_id", as: "client" } },
      { $unwind: "$client" },
    ]),
    Invoice.aggregate([
      { $match: { isArchived: false } },
      { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
      {
        $match: {
          balance: { $gt: 0 },
          dueDate: { $gte: today, $lte: new Date(today.getTime() + 7 * 86400000) },
        },
      },
      { $count: "count" },
    ]),
  ]);

  const totalClients = clientCounts[0]?.total ?? 0;
  const activeClients = clientCounts[0]?.active ?? 0;

  const statusMap = new Map<string, { count: number; amount: number; amountDue: number; amountPaid: number }>();
  for (const row of statusAgg) {
    statusMap.set(row._id, row);
  }

  const expectedRevenue = roundCurrency(
    ["Paid", "Partial", "Pending", "Overdue"].reduce((sum, s) => sum + (statusMap.get(s)?.amountDue ?? 0), 0)
  );
  const collectedRevenue = roundCurrency(
    ["Paid", "Partial", "Pending", "Overdue"].reduce((sum, s) => sum + (statusMap.get(s)?.amountPaid ?? 0), 0)
  );
  const pendingAmount = roundCurrency(statusMap.get("Pending")?.amount ?? 0);
  const overdueAmount = roundCurrency(statusMap.get("Overdue")?.amount ?? 0);
  const partialAmount = roundCurrency(statusMap.get("Partial")?.amount ?? 0);
  const outstandingBalance = roundCurrency(pendingAmount + overdueAmount + partialAmount);
  const collectionRate = expectedRevenue > 0 ? roundCurrency((collectedRevenue / expectedRevenue) * 100) : 0;

  const summary: DashboardSummary = {
    totalClients,
    activeClients,
    expectedRevenue,
    collectedRevenue,
    pendingAmount,
    overdueAmount,
    partialAmount,
    outstandingBalance,
    collectionRate,
    dueSoonCount: dueSoonAgg[0]?.count ?? 0,
  };

  const monthlyRevenue: MonthlyRevenuePoint[] = monthlyAgg
    .map((row) => ({
      month: row._id as string,
      label: formatMonthLabel(row._id as string),
      expected: roundCurrency(row.expected),
      collected: roundCurrency(row.collected),
    }))
    .reverse();

  const statusBreakdown: StatusBreakdownPoint[] = ["Paid", "Partial", "Pending", "Overdue"].map((status) => ({
    status,
    count: statusMap.get(status)?.count ?? 0,
    amount: roundCurrency(
      status === "Paid" ? statusMap.get(status)?.amountPaid ?? 0 : statusMap.get(status)?.amount ?? 0
    ),
  }));

  const topOutstanding: OutstandingClientPoint[] = topOutstandingAgg.map((row) => ({
    id: row.client._id.toString(),
    clientId: row.client.clientId,
    name: row.client.name,
    company: row.client.company,
    outstanding: roundCurrency(row.outstanding),
  }));

  return { summary, monthlyRevenue, statusBreakdown, topOutstanding };
}

function formatMonthLabel(billingMonth: string): string {
  const [year, month] = billingMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function parseDashboardFilter(query: Record<string, unknown>): DashboardFilter {
  const period = (query.period as DashboardPeriod) ?? "currentMonth";
  return {
    period,
    dateFrom: query.dateFrom ? new Date(query.dateFrom as string) : undefined,
    dateTo: query.dateTo ? new Date(query.dateTo as string) : undefined,
  };
}

