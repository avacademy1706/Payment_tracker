import mongoose from "mongoose";
import { Invoice } from "../models/Invoice";
import { Payment, type PaymentDocument } from "../models/Payment";
import { recalculateInvoice } from "./invoice.service";
import { roundCurrency } from "./status.service";
import { ApiError } from "../utils/ApiError";
import type { PaymentMode } from "../../../shared/types/enums";

export interface RecordPaymentResult {
  payment: PaymentDocument;
  invoice: Awaited<ReturnType<typeof recalculateInvoice>>;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMode: PaymentMode;
  transactionReference?: string;
  remarks?: string;
}

/**
 * Records a new payment against an invoice and atomically recalculates the
 * invoice's cached amountPaid, all inside a single transaction so the two
 * writes can never diverge (e.g. on a mid-request crash).
 */
export async function recordPayment(
  input: RecordPaymentInput,
  createdBy?: string
): Promise<RecordPaymentResult> {
  const session = await mongoose.startSession();
  try {
    let result!: RecordPaymentResult;

    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(input.invoiceId).session(session);
      if (!invoice || invoice.isArchived) {
        throw ApiError.notFound("Invoice not found.");
      }

      const remainingBalance = roundCurrency(invoice.amountDue - invoice.amountPaid);
      if (roundCurrency(input.amount) > remainingBalance) {
        throw ApiError.badRequest(
          `Payment amount cannot exceed the outstanding balance of ₹${remainingBalance.toLocaleString("en-IN")}.`,
          { amount: "Amount exceeds the outstanding balance for this invoice." }
        );
      }

      const [payment] = await Payment.create(
        [
          {
            invoice: invoice._id,
            client: invoice.client,
            amount: input.amount,
            paymentDate: input.paymentDate,
            paymentMode: input.paymentMode,
            transactionReference: input.transactionReference,
            remarks: input.remarks,
            createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
          },
        ],
        { session }
      );

      const updatedInvoice = await recalculateInvoice(invoice._id, session);
      result = { payment, invoice: updatedInvoice };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

export async function voidPayment(paymentId: string): Promise<RecordPaymentResult> {
  const session = await mongoose.startSession();
  try {
    let result!: RecordPaymentResult;

    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment || payment.isVoided) {
        throw ApiError.notFound("Payment not found.");
      }

      payment.isVoided = true;
      await payment.save({ session });

      const invoice = await recalculateInvoice(payment.invoice, session);
      result = { payment, invoice };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

export async function updatePayment(
  paymentId: string,
  updates: Partial<Omit<RecordPaymentInput, "invoiceId">>
): Promise<RecordPaymentResult> {
  const session = await mongoose.startSession();
  try {
    let result!: RecordPaymentResult;

    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment || payment.isVoided) {
        throw ApiError.notFound("Payment not found.");
      }

      const invoice = await Invoice.findById(payment.invoice).session(session);
      if (!invoice) throw ApiError.notFound("Invoice not found.");

      if (updates.amount !== undefined) {
        const balanceExcludingThisPayment = roundCurrency(
          invoice.amountDue - invoice.amountPaid + payment.amount
        );
        if (roundCurrency(updates.amount) > balanceExcludingThisPayment) {
          throw ApiError.badRequest(
            `Payment amount cannot exceed the outstanding balance of ₹${balanceExcludingThisPayment.toLocaleString("en-IN")}.`,
            { amount: "Amount exceeds the outstanding balance for this invoice." }
          );
        }
        payment.amount = updates.amount;
      }
      if (updates.paymentDate !== undefined) payment.paymentDate = updates.paymentDate;
      if (updates.paymentMode !== undefined) payment.paymentMode = updates.paymentMode;
      if (updates.transactionReference !== undefined) payment.transactionReference = updates.transactionReference;
      if (updates.remarks !== undefined) payment.remarks = updates.remarks;

      await payment.save({ session });
      const updatedInvoice = await recalculateInvoice(invoice._id, session);
      result = { payment, invoice: updatedInvoice };
    });

    return result;
  } finally {
    await session.endSession();
  }
}
