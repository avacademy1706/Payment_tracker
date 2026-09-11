import { Schema, model, Types, type Model, type HydratedDocument } from "mongoose";
import { PAYMENT_MODES, type PaymentMode } from "../../../shared/types/enums";

export interface PaymentAttrs {
  invoice: Types.ObjectId;
  client: Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMode: PaymentMode;
  transactionReference?: string;
  remarks?: string;
  /** Soft-delete flag: voided payments are kept for audit but excluded from balance calculations. */
  isVoided: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<PaymentAttrs>;
type PaymentModel = Model<PaymentAttrs>;

const paymentSchema = new Schema<PaymentAttrs, PaymentModel>(
  {
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, index: true },
    paymentMode: { type: String, enum: PAYMENT_MODES, required: true },
    transactionReference: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
    isVoided: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Payment = model<PaymentAttrs, PaymentModel>("Payment", paymentSchema, "payments");
