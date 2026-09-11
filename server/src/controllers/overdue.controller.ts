import type { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { startOfToday } from "../services/invoice.service";
import { daysOverdue } from "../services/status.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { getPagination, buildPaginatedResult } from "../utils/pagination";

export const listOverdue = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const now = new Date();
  const today = startOfToday(now);

  const pipeline = [
    { $match: { isArchived: false } },
    { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
    { $match: { balance: { $gt: 0 }, dueDate: { $lt: today } } },
    { $lookup: { from: "clients", localField: "client", foreignField: "_id", as: "client" } },
    { $unwind: "$client" },
    { $sort: { dueDate: 1 as const } },
    {
      $facet: {
        items: [{ $skip: pagination.skip }, { $limit: pagination.pageSize }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await Invoice.aggregate(pipeline);
  const items = (result?.items ?? []).map((inv: Record<string, any>) => ({
    ...inv,
    daysOverdue: daysOverdue(new Date(inv.dueDate), now),
  }));
  const total = result?.totalCount?.[0]?.count ?? 0;

  sendSuccess(res, buildPaginatedResult(items, total, pagination));
});
