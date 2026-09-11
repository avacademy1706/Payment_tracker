import * as XLSX from "xlsx";
import mongoose from "mongoose";
import { Client } from "../models/Client";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";
import { generateClientId } from "./clientId.service";
import { generateInvoiceNumber } from "./invoiceNumber.service";
import { computeDueDate, computeInvoiceDate, recalculateInvoice } from "./invoice.service";
import { parseCell, parseCurrency, parseDateCell, parseBillingMonth } from "../utils/excelParsing";
import { PAYMENT_MODES, type PaymentMode } from "../../../shared/types/enums";

const EXPECTED_COLUMNS = [
  "Client ID",
  "Client Name",
  "Company/Institute",
  "Contact Number",
  "Email",
  "Service/Course",
  "Monthly Fee (₹)",
  "Billing Month",
  "Invoice No.",
  "Payment Due Date",
  "Payment Date",
  "Payment Status",
  "Payment Mode",
  "Amount Paid (₹)",
  "Balance (₹)",
  "Remarks",
];

export interface ParsedImportRow {
  rowNumber: number;
  status: "valid" | "error" | "duplicate";
  errors: string[];
  raw: Record<string, unknown>;
  resolved?: {
    clientGroupKey: string;
    clientId?: string;
    clientName: string;
    company: string;
    phone: string;
    email: string;
    service: string;
    monthlyFee: number;
    billingMonth: string;
    invoiceNumber?: string;
    dueDate?: Date;
    amountDue: number;
    amountPaid: number;
    paymentDate?: Date;
    paymentMode?: PaymentMode;
    remarks: string;
  };
}

export interface ImportParseResult {
  columnsValid: boolean;
  missingColumns: string[];
  rows: ParsedImportRow[];
}

export async function readWorkbookRows(buffer: Buffer): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

/** A row with every expected column blank — a leftover template row, not a validation error. */
function isRowBlank(raw: Record<string, unknown>): boolean {
  return EXPECTED_COLUMNS.every((col) => parseCell(raw[col]) === "");
}

export function checkColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const normalizedActual = new Set(headers.map(normalizeHeader));
  const missing = EXPECTED_COLUMNS.filter((col) => !normalizedActual.has(normalizeHeader(col)));
  return { valid: missing.length === 0, missing };
}

/**
 * Validates every row of a raw Excel upload. Does NOT touch the database
 * except for read-only duplicate checks, so this is safe to call as a
 * "preview" before the user confirms the import.
 */
export async function parseAndValidate(buffer: Buffer): Promise<ImportParseResult> {
  const { headers, rows } = await readWorkbookRows(buffer);
  const { valid: columnsValid, missing: missingColumns } = checkColumns(headers);

  if (!columnsValid) {
    return { columnsValid, missingColumns, rows: [] };
  }

  const existingInvoiceNumbers = new Set(
    (await Invoice.find({ isArchived: false }).select("invoiceNumber").lean()).map((i) => i.invoiceNumber)
  );
  const existingClientMonths = new Set(
    (await Invoice.find({ isArchived: false }).select("client billingMonth").lean()).map(
      (i) => `${i.client.toString()}|${i.billingMonth}`
    )
  );
  const existingClients = await Client.find().select("clientId name company email").lean();
  const clientByLegacyId = new Map(existingClients.filter((c) => c.clientId).map((c) => [c.clientId, c]));
  const clientByNameKey = new Map(existingClients.map((c) => [nameKey(c.name, c.company, c.email), c]));

  const seenInBatch = new Set<string>();
  const seenInvoiceNumbers = new Set<string>();

  const results: ParsedImportRow[] = rows
    .map((raw, index) => ({ raw, rowNumber: index + 2 })) // account for header row, 1-indexed
    // Leftover blank rows below the real data (common in a table-formatted
    // template) aren't user error — skip them entirely rather than
    // reporting a wall of "Client Name is required" for empty rows.
    .filter(({ raw }) => !isRowBlank(raw))
    .map(({ raw, rowNumber }) => {
    const errors: string[] = [];

    const clientName = parseCell(raw["Client Name"]);
    const company = parseCell(raw["Company/Institute"]);
    const phone = parseCell(raw["Contact Number"]);
    const email = parseCell(raw["Email"]);
    const service = parseCell(raw["Service/Course"]);
    const rawClientId = parseCell(raw["Client ID"]);
    const invoiceNoRaw = parseCell(raw["Invoice No."]);
    const remarks = parseCell(raw["Remarks"]);

    if (!clientName) errors.push("Client Name is required.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email is not a valid address.");

    const monthlyFee = parseCurrency(raw["Monthly Fee (₹)"]);
    if (monthlyFee === null) errors.push("Monthly Fee (₹) is missing or not a valid number.");
    else if (monthlyFee < 0) errors.push("Monthly Fee (₹) cannot be negative.");

    const billingMonth = parseBillingMonth(raw["Billing Month"]);
    if (!billingMonth) errors.push('Billing Month could not be parsed (expected e.g. "2026-09" or "September 2026").');

    const dueDate = parseDateCell(raw["Payment Due Date"]);
    if (raw["Payment Due Date"] && !dueDate) errors.push("Payment Due Date is not a valid date.");

    const paymentDate = parseDateCell(raw["Payment Date"]);
    if (raw["Payment Date"] && !paymentDate) errors.push("Payment Date is not a valid date.");

    let amountPaid = parseCurrency(raw["Amount Paid (₹)"]);
    if (amountPaid === null) amountPaid = 0;
    else if (amountPaid < 0) errors.push("Amount Paid (₹) cannot be negative.");

    const paymentModeRaw = parseCell(raw["Payment Mode"]);
    let paymentMode: PaymentMode | undefined;
    if (amountPaid > 0) {
      if (!paymentDate) errors.push("Payment Date is required when Amount Paid is greater than zero.");
      const match = PAYMENT_MODES.find((m) => m.toLowerCase() === paymentModeRaw.toLowerCase());
      if (!match) {
        errors.push(`Payment Mode "${paymentModeRaw || "(blank)"}" must be one of: ${PAYMENT_MODES.join(", ")}.`);
      } else {
        paymentMode = match;
      }
    }

    if (monthlyFee !== null && amountPaid > monthlyFee) {
      errors.push("Amount Paid (₹) cannot exceed Monthly Fee (₹).");
    }

    if (errors.length > 0) {
      return { rowNumber, status: "error", errors, raw };
    }

    const groupKey = rawClientId ? `id:${rawClientId}` : `name:${nameKey(clientName, company, email)}`;
    const existingClient = rawClientId ? clientByLegacyId.get(rawClientId) : clientByNameKey.get(nameKey(clientName, company, email));

    // Duplicate invoice number already in the database or earlier in this same file.
    if (invoiceNoRaw && (existingInvoiceNumbers.has(invoiceNoRaw) || seenInvoiceNumbers.has(invoiceNoRaw))) {
      return { rowNumber, status: "duplicate", errors: [`Invoice number ${invoiceNoRaw} already exists.`], raw };
    }

    // Duplicate client + billing month, either already in DB or earlier in this same file.
    const clientDedupeKey = existingClient ? existingClient._id.toString() : groupKey;
    const monthDedupeKey = `${clientDedupeKey}|${billingMonth}`;
    if (
      (existingClient && existingClientMonths.has(`${existingClient._id.toString()}|${billingMonth}`)) ||
      seenInBatch.has(monthDedupeKey)
    ) {
      return {
        rowNumber,
        status: "duplicate",
        errors: [`${clientName} already has an invoice for ${billingMonth}.`],
        raw,
      };
    }

    seenInBatch.add(monthDedupeKey);
    if (invoiceNoRaw) seenInvoiceNumbers.add(invoiceNoRaw);

    return {
      rowNumber,
      status: "valid",
      errors: [],
      raw,
      resolved: {
        clientGroupKey: groupKey,
        clientId: existingClient?.clientId,
        clientName,
        company,
        phone,
        email,
        service,
        monthlyFee: monthlyFee as number,
        billingMonth: billingMonth as string,
        invoiceNumber: invoiceNoRaw || undefined,
        dueDate: dueDate ?? undefined,
        amountDue: monthlyFee as number,
        amountPaid,
        paymentDate: paymentDate ?? undefined,
        paymentMode,
        remarks,
      },
    };
  });

  return { columnsValid, missingColumns, rows: results };
}

function nameKey(name: string, company: string, email: string): string {
  return `${name.trim().toLowerCase()}|${company.trim().toLowerCase()}|${email.trim().toLowerCase()}`;
}

export interface CommitImportSummary {
  imported: number;
  skipped: number;
  errors: number;
  clientsCreated: number;
}

/**
 * Commits a previously validated set of rows inside a single transaction —
 * either every valid row is written, or (on unexpected failure) none are.
 * Rows already flagged as "error"/"duplicate" by parseAndValidate are
 * skipped and counted, not retried.
 */
export async function commitImport(parseResult: ImportParseResult): Promise<CommitImportSummary> {
  const validRows = parseResult.rows.filter((r) => r.status === "valid" && r.resolved);
  const summary: CommitImportSummary = {
    imported: 0,
    skipped: parseResult.rows.length - validRows.length,
    errors: parseResult.rows.filter((r) => r.status === "error").length,
    clientsCreated: 0,
  };

  if (validRows.length === 0) return summary;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // withTransaction may transparently retry this callback on a transient
      // error, re-running every statement inside it. Counters must therefore
      // be local to each attempt and only copied onto `summary` once the
      // attempt fully succeeds — mutating `summary` directly here would
      // double-count on a retry even though the DB writes stay correct.
      let imported = 0;
      let clientsCreated = 0;
      const clientCache = new Map<string, mongoose.Types.ObjectId>();

      for (const row of validRows) {
        const r = row.resolved!;

        let clientObjectId = clientCache.get(r.clientGroupKey);
        if (!clientObjectId) {
          let clientDoc = r.clientId
            ? await Client.findOne({ clientId: r.clientId }).session(session)
            : await Client.findOne({
                name: r.clientName,
                company: r.company,
                email: r.email,
              }).session(session);

          if (!clientDoc) {
            const newClientId = await generateClientId();
            [clientDoc] = await Client.create(
              [
                {
                  clientId: newClientId,
                  name: r.clientName,
                  company: r.company,
                  phone: r.phone,
                  email: r.email,
                  service: r.service,
                  monthlyFee: r.monthlyFee,
                  defaultDueDay: 5,
                  isActive: true,
                },
              ],
              { session }
            );
            clientsCreated += 1;
          }
          clientObjectId = clientDoc._id;
          clientCache.set(r.clientGroupKey, clientObjectId);
        }

        const invoiceDate = computeInvoiceDate(r.billingMonth);
        const dueDate = r.dueDate ?? computeDueDate(r.billingMonth, 5);
        const invoiceNumber = r.invoiceNumber ?? (await generateInvoiceNumber(invoiceDate));

        const [invoice] = await Invoice.create(
          [
            {
              invoiceNumber,
              client: clientObjectId,
              billingMonth: r.billingMonth,
              invoiceDate,
              dueDate,
              amountDue: r.amountDue,
              amountPaid: 0,
              notes: r.remarks,
            },
          ],
          { session }
        );

        if (r.amountPaid > 0 && r.paymentDate && r.paymentMode) {
          await Payment.create(
            [
              {
                invoice: invoice._id,
                client: clientObjectId,
                amount: r.amountPaid,
                paymentDate: r.paymentDate,
                paymentMode: r.paymentMode,
                remarks: r.remarks,
              },
            ],
            { session }
          );
          await recalculateInvoice(invoice._id, session);
        }

        imported += 1;
      }

      summary.imported = imported;
      summary.clientsCreated = clientsCreated;
    });
  } finally {
    await session.endSession();
  }

  return summary;
}
