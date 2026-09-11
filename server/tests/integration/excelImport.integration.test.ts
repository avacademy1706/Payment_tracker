import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from "../setup";
import { parseAndValidate, commitImport } from "../../src/services/excelImport.service";
import { Client } from "../../src/models/Client";
import { Invoice } from "../../src/models/Invoice";
import { Payment } from "../../src/models/Payment";

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
beforeEach(clearTestDatabase);

const HEADERS = [
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

async function buildWorkbookBuffer(rows: Record<string, unknown>[]): Promise<Buffer> {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Payments");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("Excel import validation", () => {
  it("flags a row missing the Client Name and Billing Month as an error", async () => {
    const buffer = await buildWorkbookBuffer([
      {
        "Client ID": "",
        "Client Name": "",
        "Company/Institute": "",
        "Contact Number": "",
        Email: "",
        "Service/Course": "",
        "Monthly Fee (₹)": 10000,
        "Billing Month": "",
        "Invoice No.": "",
        "Payment Due Date": "",
        "Payment Date": "",
        "Payment Status": "",
        "Payment Mode": "",
        "Amount Paid (₹)": "",
        "Balance (₹)": "",
        Remarks: "",
      },
    ]);

    const result = await parseAndValidate(buffer);
    expect(result.columnsValid).toBe(true);
    expect(result.rows[0].status).toBe("error");
    expect(result.rows[0].errors.join(" ")).toMatch(/Client Name/);
    expect(result.rows[0].errors.join(" ")).toMatch(/Billing Month/);
  });

  it("rejects a file missing required columns before looking at any rows", async () => {
    const worksheet = XLSX.utils.json_to_sheet([{ "Client Name": "X", "Some Other Column": 1 }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const result = await parseAndValidate(buffer);
    expect(result.columnsValid).toBe(false);
    expect(result.missingColumns.length).toBeGreaterThan(0);
  });

  it("imports a valid row, creating the client, invoice and payment, and reflects it in the commit summary", async () => {
    const buffer = await buildWorkbookBuffer([
      {
        "Client ID": "",
        "Client Name": "Imported Client",
        "Company/Institute": "Imported Co",
        "Contact Number": "9000000000",
        Email: "imported@example.com",
        "Service/Course": "Consulting",
        "Monthly Fee (₹)": 30000,
        "Billing Month": "September 2026",
        "Invoice No.": "",
        "Payment Due Date": "",
        "Payment Date": "2026-09-04",
        "Payment Status": "Paid",
        "Payment Mode": "UPI",
        "Amount Paid (₹)": 30000,
        "Balance (₹)": 0,
        Remarks: "Imported from Excel",
      },
    ]);

    const parsed = await parseAndValidate(buffer);
    expect(parsed.rows[0].status).toBe("valid");

    const summary = await commitImport(parsed);
    expect(summary.imported).toBe(1);
    expect(summary.clientsCreated).toBe(1);

    const client = await Client.findOne({ name: "Imported Client" });
    expect(client).not.toBeNull();

    const invoice = await Invoice.findOne({ client: client!._id });
    expect(invoice?.billingMonth).toBe("2026-09");
    expect(invoice?.amountPaid).toBe(30000);

    const payments = await Payment.find({ invoice: invoice!._id });
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(30000);
  });

  it("detects a duplicate client + billing month within the same file and only imports the first occurrence", async () => {
    const row = {
      "Client ID": "",
      "Client Name": "Dup Client",
      "Company/Institute": "",
      "Contact Number": "",
      Email: "",
      "Service/Course": "",
      "Monthly Fee (₹)": 15000,
      "Billing Month": "2026-09",
      "Invoice No.": "",
      "Payment Due Date": "",
      "Payment Date": "",
      "Payment Status": "",
      "Payment Mode": "",
      "Amount Paid (₹)": "",
      "Balance (₹)": "",
      Remarks: "",
    };
    const buffer = await buildWorkbookBuffer([row, { ...row }]);

    const parsed = await parseAndValidate(buffer);
    expect(parsed.rows[0].status).toBe("valid");
    expect(parsed.rows[1].status).toBe("duplicate");

    const summary = await commitImport(parsed);
    expect(summary.imported).toBe(1);
    expect(summary.skipped).toBe(1);
  });

  it("detects a duplicate against an invoice that already exists in the database", async () => {
    const client = await Client.create({
      clientId: "CL-0099",
      name: "Existing Client",
      company: "",
      phone: "",
      email: "",
      service: "",
      monthlyFee: 12000,
      defaultDueDay: 5,
    });
    await Invoice.create({
      invoiceNumber: "INV-2026-9001",
      client: client._id,
      billingMonth: "2026-09",
      invoiceDate: new Date("2026-09-01"),
      dueDate: new Date("2026-09-05"),
      amountDue: 12000,
      amountPaid: 0,
    });

    const buffer = await buildWorkbookBuffer([
      {
        "Client ID": "",
        "Client Name": "Existing Client",
        "Company/Institute": "",
        "Contact Number": "",
        Email: "",
        "Service/Course": "",
        "Monthly Fee (₹)": 12000,
        "Billing Month": "2026-09",
        "Invoice No.": "",
        "Payment Due Date": "",
        "Payment Date": "",
        "Payment Status": "",
        "Payment Mode": "",
        "Amount Paid (₹)": "",
        "Balance (₹)": "",
        Remarks: "",
      },
    ]);

    const parsed = await parseAndValidate(buffer);
    expect(parsed.rows[0].status).toBe("duplicate");
  });

  it("rejects a row where Amount Paid exceeds Monthly Fee", async () => {
    const buffer = await buildWorkbookBuffer([
      {
        "Client ID": "",
        "Client Name": "Overpay Client",
        "Company/Institute": "",
        "Contact Number": "",
        Email: "",
        "Service/Course": "",
        "Monthly Fee (₹)": 10000,
        "Billing Month": "2026-09",
        "Invoice No.": "",
        "Payment Due Date": "",
        "Payment Date": "2026-09-04",
        "Payment Status": "",
        "Payment Mode": "UPI",
        "Amount Paid (₹)": 15000,
        "Balance (₹)": "",
        Remarks: "",
      },
    ]);

    const parsed = await parseAndValidate(buffer);
    expect(parsed.rows[0].status).toBe("error");
  });

  it("parses a real-world workbook saved as an Excel Table (ListObject), not just a plain range", async () => {
    // Regression test: the project's own Client_Monthly_Payment_Record.xlsx
    // template formats its data as an Excel Table (Insert > Table), which
    // adds an xl/tables/table1.xml part to the workbook. An earlier version
    // of the import pipeline (exceljs) crashed on this with
    // "Cannot read properties of undefined (reading 'name')" — xlsx (SheetJS)
    // handles it correctly, but this guards against a future regression.
    // Fixture is a frozen copy of the template, independent of whatever the
    // user has since typed into the real Client_Monthly_Payment_Record.xlsx.
    const fixturePath = path.resolve(import.meta.dirname, "../fixtures/table-format-sample.xlsx");
    const buffer = fs.readFileSync(fixturePath);

    const result = await parseAndValidate(buffer);
    expect(result.columnsValid).toBe(true);
    // The fixture is the blank template — every row is a leftover empty
    // table row, none of which should be reported at all (see the "skips
    // fully blank rows" test below for the behavior being exercised here).
    expect(result.rows).toHaveLength(0);
  });

  it("skips fully blank rows instead of reporting them as errors", async () => {
    const blankRow = {
      "Client ID": "",
      "Client Name": "",
      "Company/Institute": "",
      "Contact Number": "",
      Email: "",
      "Service/Course": "",
      "Monthly Fee (₹)": "",
      "Billing Month": "",
      "Invoice No.": "",
      "Payment Due Date": "",
      "Payment Date": "",
      "Payment Status": "",
      "Payment Mode": "",
      "Amount Paid (₹)": "",
      "Balance (₹)": "",
      Remarks: "",
    };
    const realRow = {
      ...blankRow,
      "Client Name": "Real Client",
      "Monthly Fee (₹)": 5000,
      "Billing Month": "2026-09",
    };
    const buffer = await buildWorkbookBuffer([blankRow, realRow, blankRow]);

    const result = await parseAndValidate(buffer);
    // Only the one real row should appear at all — both blank rows vanish
    // rather than showing up as "Client Name is required" errors.
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].status).toBe("valid");
    expect(result.rows[0].resolved?.clientName).toBe("Real Client");
  });
});
