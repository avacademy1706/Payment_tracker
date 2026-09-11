import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from "../setup";
import { Client } from "../../src/models/Client";
import { Invoice } from "../../src/models/Invoice";
import { generateInvoiceNumber } from "../../src/services/invoiceNumber.service";
import { recordPayment } from "../../src/services/payment.service";
import { computeStatus } from "../../src/services/status.service";

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
beforeEach(clearTestDatabase);

async function makeInvoice(amountDue: number) {
  const client = await Client.create({
    clientId: "CL-0001",
    name: "Test Client",
    company: "Test Co",
    phone: "9999999999",
    email: "test@example.com",
    service: "Consulting",
    monthlyFee: amountDue,
    defaultDueDay: 5,
  });
  const invoice = await Invoice.create({
    invoiceNumber: await generateInvoiceNumber(),
    client: client._id,
    billingMonth: "2026-09",
    invoiceDate: new Date("2026-09-01"),
    dueDate: new Date("2026-09-05"),
    amountDue,
    amountPaid: 0,
  });
  return { client, invoice };
}

describe("recordPayment (partial payments)", () => {
  it("walks the ₹50,000 invoice through three partial payments to Paid, matching the spec example exactly", async () => {
    const { invoice } = await makeInvoice(50000);

    let { invoice: updated } = await recordPayment({
      invoiceId: invoice._id.toString(),
      amount: 20000,
      paymentDate: new Date("2026-09-02"),
      paymentMode: "UPI",
    });
    expect(updated.amountPaid).toBe(20000);
    expect(updated.amountDue - updated.amountPaid).toBe(30000);

    ({ invoice: updated } = await recordPayment({
      invoiceId: invoice._id.toString(),
      amount: 10000,
      paymentDate: new Date("2026-09-03"),
      paymentMode: "Bank Transfer",
    }));
    expect(updated.amountDue - updated.amountPaid).toBe(20000);

    ({ invoice: updated } = await recordPayment({
      invoiceId: invoice._id.toString(),
      amount: 20000,
      paymentDate: new Date("2026-09-04"),
      paymentMode: "Cash",
    }));
    expect(updated.amountDue - updated.amountPaid).toBe(0);
    expect(computeStatus(updated.amountDue, updated.amountPaid, updated.dueDate)).toBe("Paid");
  });

  it("preserves every individual payment transaction rather than overwriting a single payment record", async () => {
    const { invoice } = await makeInvoice(50000);
    await recordPayment({ invoiceId: invoice._id.toString(), amount: 20000, paymentDate: new Date(), paymentMode: "UPI" });
    await recordPayment({ invoiceId: invoice._id.toString(), amount: 15000, paymentDate: new Date(), paymentMode: "Cash" });
    await recordPayment({ invoiceId: invoice._id.toString(), amount: 15000, paymentDate: new Date(), paymentMode: "Card" });

    const { Payment } = await import("../../src/models/Payment");
    const payments = await Payment.find({ invoice: invoice._id });
    expect(payments).toHaveLength(3);
    expect(payments.reduce((sum, p) => sum + p.amount, 0)).toBe(50000);
  });

  it("rejects a payment that would exceed the remaining balance", async () => {
    const { invoice } = await makeInvoice(50000);
    await recordPayment({ invoiceId: invoice._id.toString(), amount: 40000, paymentDate: new Date(), paymentMode: "UPI" });

    await expect(
      recordPayment({ invoiceId: invoice._id.toString(), amount: 20000, paymentDate: new Date(), paymentMode: "UPI" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a payment against a non-existent invoice", async () => {
    const { Types } = await import("mongoose");
    await expect(
      recordPayment({ invoiceId: new Types.ObjectId().toString(), amount: 100, paymentDate: new Date(), paymentMode: "Cash" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("duplicate invoice prevention", () => {
  it("rejects a second active invoice for the same client and billing month", async () => {
    const { client } = await makeInvoice(50000);

    await expect(
      Invoice.create({
        invoiceNumber: await generateInvoiceNumber(),
        client: client._id,
        billingMonth: "2026-09",
        invoiceDate: new Date("2026-09-01"),
        dueDate: new Date("2026-09-05"),
        amountDue: 50000,
        amountPaid: 0,
      })
    ).rejects.toThrow();
  });

  it("allows a new invoice once the previous one for that month is archived", async () => {
    const { client, invoice } = await makeInvoice(50000);
    invoice.isArchived = true;
    await invoice.save();

    const second = await Invoice.create({
      invoiceNumber: await generateInvoiceNumber(),
      client: client._id,
      billingMonth: "2026-09",
      invoiceDate: new Date("2026-09-01"),
      dueDate: new Date("2026-09-05"),
      amountDue: 50000,
      amountPaid: 0,
    });
    expect(second._id).toBeDefined();
  });
});

describe("invoice numbers", () => {
  it("generates unique, sequential, year-prefixed invoice numbers", async () => {
    const a = await generateInvoiceNumber(new Date("2026-01-15"));
    const b = await generateInvoiceNumber(new Date("2026-06-15"));
    expect(a).toBe("INV-2026-0001");
    expect(b).toBe("INV-2026-0002");
  });
});
