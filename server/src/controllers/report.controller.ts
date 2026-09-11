import type { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { roundCurrency } from "../services/status.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";

function dateRangeFilter(req: Request, field: string) {
  if (!req.query.dateFrom && !req.query.dateTo) return {};
  return {
    [field]: {
      ...(req.query.dateFrom ? { $gte: new Date(req.query.dateFrom as string) } : {}),
      ...(req.query.dateTo ? { $lte: new Date(req.query.dateTo as string) } : {}),
    },
  };
}

export const monthlyCollectionReport = asyncHandler(async (req: Request, res: Response) => {
  const rows = await Invoice.aggregate([
    { $match: { isArchived: false, ...dateRangeFilter(req, "invoiceDate") } },
    {
      $group: {
        _id: "$billingMonth",
        expected: { $sum: "$amountDue" },
        collected: { $sum: "$amountPaid" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const data = rows.map((row) => {
    const expected = roundCurrency(row.expected);
    const collected = roundCurrency(row.collected);
    return {
      month: row._id as string,
      expected,
      collected,
      outstanding: roundCurrency(expected - collected),
      collectionRate: expected > 0 ? roundCurrency((collected / expected) * 100) : 0,
    };
  });

  sendSuccess(res, data);
});

export const clientWiseReport = asyncHandler(async (req: Request, res: Response) => {
  const rows = await Invoice.aggregate([
    { $match: { isArchived: false, ...dateRangeFilter(req, "invoiceDate") } },
    {
      $group: {
        _id: "$client",
        totalBilled: { $sum: "$amountDue" },
        totalPaid: { $sum: "$amountPaid" },
      },
    },
    { $lookup: { from: "clients", localField: "_id", foreignField: "_id", as: "client" } },
    { $unwind: "$client" },
    { $sort: { totalBilled: -1 } },
  ]);

  const data = rows.map((row) => ({
    clientId: row.client.clientId,
    name: row.client.name,
    company: row.client.company,
    totalBilled: roundCurrency(row.totalBilled),
    totalPaid: roundCurrency(row.totalPaid),
    outstanding: roundCurrency(row.totalBilled - row.totalPaid),
  }));

  sendSuccess(res, data);
});

export const paymentModeReport = asyncHandler(async (req: Request, res: Response) => {
  const rows = await Payment.aggregate([
    { $match: { isVoided: false, ...dateRangeFilter(req, "paymentDate") } },
    { $group: { _id: "$paymentMode", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const data = rows.map((row) => ({
    paymentMode: row._id as string,
    total: roundCurrency(row.total),
    count: row.count as number,
  }));

  sendSuccess(res, data);
});
