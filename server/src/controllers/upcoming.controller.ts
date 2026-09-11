import type { Request, Response } from "express";
import { Invoice } from "../models/Invoice";
import { startOfToday } from "../services/invoice.service";
import { daysUntilDue } from "../services/status.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";

export const listUpcoming = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const today = startOfToday(now);
  const withinDays = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const horizon = new Date(today.getTime() + withinDays * 86400000);

  const pipeline = [
    { $match: { isArchived: false } },
    { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
    { $match: { balance: { $gt: 0 }, dueDate: { $gte: today, $lte: horizon } } },
    { $lookup: { from: "clients", localField: "client", foreignField: "_id", as: "client" } },
    { $unwind: "$client" },
    { $sort: { dueDate: 1 as const } },
  ];

  const invoices = await Invoice.aggregate(pipeline);
  const items = invoices.map((inv) => ({ ...inv, daysRemaining: daysUntilDue(new Date(inv.dueDate), now) }));

  sendSuccess(res, items);
});
