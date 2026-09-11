import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Payment } from "../models/Payment";
import { recordPayment, voidPayment, updatePayment } from "../services/payment.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../utils/pagination";
import type { PaymentInputParsed } from "../validators/payment.validator";

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as PaymentInputParsed;
  const { payment, invoice } = await recordPayment(input, req.user?.id);
  sendCreated(res, { payment, invoice }, "Payment recorded successfully.");
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const filter: mongoose.FilterQuery<typeof Payment.schema.obj> = { isVoided: false };

  if (req.query.clientId) filter.client = new mongoose.Types.ObjectId(req.query.clientId as string);
  if (req.query.invoiceId) filter.invoice = new mongoose.Types.ObjectId(req.query.invoiceId as string);
  if (req.query.paymentMode) filter.paymentMode = req.query.paymentMode as string;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.paymentDate = {
      ...(req.query.dateFrom ? { $gte: new Date(req.query.dateFrom as string) } : {}),
      ...(req.query.dateTo ? { $lte: new Date(req.query.dateTo as string) } : {}),
    };
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("invoice", "invoiceNumber billingMonth amountDue amountPaid dueDate")
      .populate("client", "clientId name company")
      .sort({ paymentDate: -1 })
      .skip(pagination.skip)
      .limit(pagination.pageSize),
    Payment.countDocuments(filter),
  ]);

  sendSuccess(res, buildPaginatedResult(payments, total, pagination));
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await Payment.findById(req.params.id)
    .populate("invoice", "invoiceNumber billingMonth amountDue amountPaid dueDate")
    .populate("client", "clientId name company");
  if (!payment) throw ApiError.notFound("Payment not found.");
  sendSuccess(res, payment);
});

export const editPayment = asyncHandler(async (req: Request, res: Response) => {
  const { payment, invoice } = await updatePayment(req.params.id, req.body);
  sendSuccess(res, { payment, invoice }, "Payment updated successfully.");
});

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
  const { payment, invoice } = await voidPayment(req.params.id);
  sendSuccess(res, { payment, invoice }, "Payment voided.");
});
