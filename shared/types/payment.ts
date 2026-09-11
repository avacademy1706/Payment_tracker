import type { PaymentMode } from "./enums";

export interface Payment {
  _id: string;
  invoice: string;
  client: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  transactionReference?: string;
  remarks?: string;
  isVoided: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  transactionReference?: string;
  remarks?: string;
}
