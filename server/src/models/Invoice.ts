import { Schema, model, Types, type Model, type HydratedDocument } from "mongoose";

export interface InvoiceAttrs {
  invoiceNumber: string;
  client: Types.ObjectId;
  billingMonth: string; // "YYYY-MM"
  invoiceDate: Date;
  dueDate: Date;
  amountDue: number;
  /**
   * Cached sum of non-voided payments against this invoice. This is a
   * denormalized read-optimization only — it is always recalculated from
   * the Payment collection (see invoice.service.ts#recalculateInvoice) and
   * must never be written directly from client input. Balance and status
   * are derived from this field, not stored.
   */
  amountPaid: number;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceDocument = HydratedDocument<InvoiceAttrs>;
type InvoiceModel = Model<InvoiceAttrs>;

const invoiceSchema = new Schema<InvoiceAttrs, InvoiceModel>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    billingMonth: { type: String, required: true, index: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A client cannot have two active invoices for the same billing month.
invoiceSchema.index(
  { client: 1, billingMonth: 1 },
  { unique: true, partialFilterExpression: { isArchived: false } }
);

export const Invoice = model<InvoiceAttrs, InvoiceModel>("Invoice", invoiceSchema, "invoices");
