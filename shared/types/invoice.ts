import type { PaymentStatus } from "./enums";

export interface InvoiceClientRef {
  _id: string;
  clientId: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  service: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: string | InvoiceClientRef;
  billingMonth: string; // "YYYY-MM"
  invoiceDate: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: PaymentStatus;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceInput {
  clientId: string;
  billingMonth: string;
  invoiceDate?: string;
  dueDate?: string;
  amountDue: number;
  notes?: string;
}
