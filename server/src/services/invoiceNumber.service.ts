import { nextSequence } from "../models/Counter";

export async function generateInvoiceNumber(date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const seq = await nextSequence(`invoice-${year}`);
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}
