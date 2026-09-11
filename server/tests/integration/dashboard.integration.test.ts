import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from "../setup";
import { Client } from "../../src/models/Client";
import { Invoice } from "../../src/models/Invoice";
import { recordPayment } from "../../src/services/payment.service";
import { getDashboard } from "../../src/services/dashboard.service";

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
beforeEach(clearTestDatabase);

async function makeClient(monthlyFee: number, defaultDueDay = 5) {
  return Client.create({
    clientId: `CL-${Math.random().toString(36).slice(2, 8)}`,
    name: "Dashboard Test Client",
    company: "",
    phone: "9999999999",
    email: `dash-${Math.random().toString(36).slice(2, 8)}@example.com`,
    service: "Consulting",
    monthlyFee,
    defaultDueDay,
  });
}

describe("getDashboard", () => {
  it("computes expected/collected/outstanding and the collection rate for the current month", async () => {
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const paidClient = await makeClient(10000);
    const paidInvoice = await Invoice.create({
      invoiceNumber: "INV-TEST-0001",
      client: paidClient._id,
      billingMonth,
      invoiceDate: now,
      dueDate: new Date(now.getTime() + 5 * 86400000),
      amountDue: 10000,
      amountPaid: 0,
    });
    await recordPayment({ invoiceId: paidInvoice._id.toString(), amount: 10000, paymentDate: now, paymentMode: "UPI" });

    const partialClient = await makeClient(20000);
    const partialInvoice = await Invoice.create({
      invoiceNumber: "INV-TEST-0002",
      client: partialClient._id,
      billingMonth,
      invoiceDate: now,
      dueDate: new Date(now.getTime() + 5 * 86400000),
      amountDue: 20000,
      amountPaid: 0,
    });
    await recordPayment({ invoiceId: partialInvoice._id.toString(), amount: 5000, paymentDate: now, paymentMode: "Cash" });

    const pendingClient = await makeClient(15000);
    await Invoice.create({
      invoiceNumber: "INV-TEST-0003",
      client: pendingClient._id,
      billingMonth,
      invoiceDate: now,
      dueDate: new Date(now.getTime() + 5 * 86400000),
      amountDue: 15000,
      amountPaid: 0,
    });

    const overdueClient = await makeClient(8000);
    await Invoice.create({
      invoiceNumber: "INV-TEST-0004",
      client: overdueClient._id,
      billingMonth,
      invoiceDate: new Date(now.getTime() - 20 * 86400000),
      dueDate: new Date(now.getTime() - 10 * 86400000),
      amountDue: 8000,
      amountPaid: 0,
    });

    const { summary, statusBreakdown } = await getDashboard({ period: "currentMonth" });

    expect(summary.totalClients).toBe(4);
    expect(summary.expectedRevenue).toBe(10000 + 20000 + 15000 + 8000);
    expect(summary.collectedRevenue).toBe(10000 + 5000);
    expect(summary.pendingAmount).toBe(15000);
    expect(summary.overdueAmount).toBe(8000);
    expect(summary.partialAmount).toBe(15000); // 20000 - 5000
    expect(summary.outstandingBalance).toBe(15000 + 8000 + 15000);
    // The service rounds collectionRate to 2 decimal places for display, so
    // compare against that same precision rather than the raw fraction.
    expect(summary.collectionRate).toBeCloseTo((15000 / 53000) * 100, 1);

    const byStatus = Object.fromEntries(statusBreakdown.map((s) => [s.status, s.count]));
    expect(byStatus.Paid).toBe(1);
    expect(byStatus.Partial).toBe(1);
    expect(byStatus.Pending).toBe(1);
    expect(byStatus.Overdue).toBe(1);
  });

  it("never divides by zero when there is no data for the period", async () => {
    const { summary } = await getDashboard({ period: "currentMonth" });
    expect(summary.expectedRevenue).toBe(0);
    expect(summary.collectionRate).toBe(0);
  });
});
