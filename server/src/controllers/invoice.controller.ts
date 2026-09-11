import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Client } from "../models/Client";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";
import {
  computeDueDate,
  computeInvoiceDate,
  recalculateInvoice,
  statusMatchStage,
  withInvoiceComputedFields,
  SORT_STAGES,
} from "../services/invoice.service";
import { generateInvoiceNumber } from "../services/invoiceNumber.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../utils/pagination";
import type { InvoiceInputParsed } from "../validators/invoice.validator";

interface AggregatedInvoiceRow {
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  [key: string]: unknown;
}

const withComputedFields = withInvoiceComputedFields;

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const now = new Date();

  const match: Record<string, unknown> = { isArchived: false };

  if (req.query.clientId) {
    match.client = new mongoose.Types.ObjectId(req.query.clientId as string);
  }
  if (req.query.billingMonth) {
    match.billingMonth = req.query.billingMonth as string;
  }
  if (req.query.dateFrom || req.query.dateTo) {
    match.dueDate = {
      ...(req.query.dateFrom ? { $gte: new Date(req.query.dateFrom as string) } : {}),
      ...(req.query.dateTo ? { $lte: new Date(req.query.dateTo as string) } : {}),
    };
  }

  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
    { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
  ];

  const status = req.query.status as string | undefined;
  if (status && status !== "All") {
    const statusStage = statusMatchStage(status, now);
    if (statusStage) pipeline.push({ $match: statusStage });
  }

  pipeline.push({
    $lookup: { from: "clients", localField: "client", foreignField: "_id", as: "client" },
  });
  pipeline.push({ $unwind: "$client" });

  const search = (req.query.search as string | undefined)?.trim();
  if (search) {
    const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { invoiceNumber: rx },
          { "client.name": rx },
          { "client.clientId": rx },
          { "client.company": rx },
        ],
      },
    });
  }

  const sortKey = (req.query.sort as string) || "newest";
  pipeline.push({ $sort: SORT_STAGES[sortKey] ?? SORT_STAGES.newest });

  pipeline.push({
    $facet: {
      items: [{ $skip: pagination.skip }, { $limit: pagination.pageSize }],
      totalCount: [{ $count: "count" }],
    },
  });

  const [result] = await Invoice.aggregate(pipeline);
  const items = (result?.items ?? []).map((inv: AggregatedInvoiceRow) => withComputedFields(inv, now));
  const total = result?.totalCount?.[0]?.count ?? 0;

  sendSuccess(res, buildPaginatedResult(items, total, pagination));
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findById(req.params.id).populate(
    "client",
    "clientId name company phone email service"
  );
  if (!invoice) throw ApiError.notFound("Invoice not found.");
  sendSuccess(res, withComputedFields(invoice.toObject()));
});

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as InvoiceInputParsed;

  const client = await Client.findById(input.clientId);
  if (!client) throw ApiError.badRequest("Selected client does not exist.");

  const existing = await Invoice.findOne({
    client: client._id,
    billingMonth: input.billingMonth,
    isArchived: false,
  });
  if (existing) {
    throw ApiError.conflict(
      `An invoice for ${client.name} already exists for ${input.billingMonth}. Edit the existing invoice instead.`
    );
  }

  const invoiceDate = input.invoiceDate ?? computeInvoiceDate(input.billingMonth);
  const dueDate = input.dueDate ?? computeDueDate(input.billingMonth, client.defaultDueDay);
  const invoiceNumber = await generateInvoiceNumber(invoiceDate);

  const invoice = await Invoice.create({
    invoiceNumber,
    client: client._id,
    billingMonth: input.billingMonth,
    invoiceDate,
    dueDate,
    amountDue: input.amountDue,
    amountPaid: 0,
    notes: input.notes,
  });

  sendCreated(res, withComputedFields(invoice.toObject()), "Invoice created successfully.");
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!invoice) throw ApiError.notFound("Invoice not found.");
  sendSuccess(res, withComputedFields(invoice.toObject()), "Invoice updated successfully.");
});

export const archiveInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
  if (!invoice) throw ApiError.notFound("Invoice not found.");
  sendSuccess(res, invoice, "Invoice archived.");
});

export const getInvoicePayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await Payment.find({ invoice: req.params.id, isVoided: false }).sort({ paymentDate: -1 });
  sendSuccess(res, payments);
});

export const recalculateInvoiceBalance = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await recalculateInvoice(req.params.id);
  sendSuccess(res, withComputedFields(invoice.toObject()));
});
