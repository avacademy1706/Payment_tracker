import * as XLSX from "xlsx";
import { Client, type ClientAttrs } from "../models/Client";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { computeStatus, roundCurrency } from "./status.service";
import { startOfToday } from "./invoice.service";
import type { HydratedDocument } from "mongoose";

function toWorkbookBuffer(rows: Record<string, unknown>[], sheetName: string): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function formatDate(date?: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN");
}

export async function exportClients(): Promise<Buffer> {
  const clients = await Client.find().sort({ createdAt: 1 }).lean<HydratedDocument<ClientAttrs>[]>();
  const rows = clients.map((c) => ({
    "Client ID": c.clientId,
    "Client Name": c.name,
    "Company/Institute": c.company,
    "Contact Number": c.phone,
    Email: c.email,
    "Service/Course": c.service,
    "Monthly Fee (₹)": c.monthlyFee,
    "Default Due Day": c.defaultDueDay,
    Status: c.isActive ? "Active" : "Archived",
    Notes: c.notes ?? "",
  }));
  return toWorkbookBuffer(rows, "Clients");
}

interface InvoiceExportFilter {
  billingMonth?: string;
  onlyOverdue?: boolean;
  onlyOutstanding?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function exportInvoices(filter: InvoiceExportFilter): Promise<Buffer> {
  const match: Record<string, unknown> = { isArchived: false };
  if (filter.billingMonth) match.billingMonth = filter.billingMonth;
  if (filter.dateFrom || filter.dateTo) {
    match.invoiceDate = {
      ...(filter.dateFrom ? { $gte: filter.dateFrom } : {}),
      ...(filter.dateTo ? { $lte: filter.dateTo } : {}),
    };
  }

  const invoices = await Invoice.find(match).populate("client", "clientId name company phone email service").sort({ invoiceDate: -1 });
  const now = new Date();
  const today = startOfToday(now);

  const rows = invoices
    .map((inv) => {
      const client = inv.client as unknown as ClientAttrs & { clientId: string };
      const balance = roundCurrency(inv.amountDue - inv.amountPaid);
      const status = computeStatus(inv.amountDue, inv.amountPaid, inv.dueDate, now);
      return { inv, client, balance, status };
    })
    .filter((row) => {
      if (filter.onlyOverdue && !(row.balance > 0 && row.inv.dueDate < today)) return false;
      if (filter.onlyOutstanding && row.balance <= 0) return false;
      return true;
    })
    .map(({ inv, client, balance, status }) => ({
      "Client ID": client.clientId,
      "Client Name": client.name,
      "Company/Institute": client.company,
      "Contact Number": client.phone,
      Email: client.email,
      "Service/Course": client.service,
      "Invoice No.": inv.invoiceNumber,
      "Billing Month": inv.billingMonth,
      "Monthly Fee (₹)": inv.amountDue,
      "Payment Due Date": formatDate(inv.dueDate),
      "Amount Paid (₹)": inv.amountPaid,
      "Balance (₹)": balance,
      "Payment Status": status,
      Remarks: inv.notes ?? "",
    }));

  return toWorkbookBuffer(rows, "Invoices");
}

export async function exportPayments(filter: { dateFrom?: Date; dateTo?: Date }): Promise<Buffer> {
  const match: Record<string, unknown> = { isVoided: false };
  if (filter.dateFrom || filter.dateTo) {
    match.paymentDate = {
      ...(filter.dateFrom ? { $gte: filter.dateFrom } : {}),
      ...(filter.dateTo ? { $lte: filter.dateTo } : {}),
    };
  }

  const payments = await Payment.find(match)
    .populate("client", "clientId name company")
    .populate("invoice", "invoiceNumber billingMonth")
    .sort({ paymentDate: -1 });

  const rows = payments.map((p) => {
    const client = p.client as unknown as ClientAttrs & { clientId: string };
    const invoice = p.invoice as unknown as { invoiceNumber: string; billingMonth: string };
    return {
      "Client ID": client.clientId,
      "Client Name": client.name,
      "Company/Institute": client.company,
      "Invoice No.": invoice.invoiceNumber,
      "Billing Month": invoice.billingMonth,
      "Payment Date": formatDate(p.paymentDate),
      "Amount Paid (₹)": p.amount,
      "Payment Mode": p.paymentMode,
      "Transaction Reference": p.transactionReference ?? "",
      Remarks: p.remarks ?? "",
    };
  });

  return toWorkbookBuffer(rows, "Payments");
}
