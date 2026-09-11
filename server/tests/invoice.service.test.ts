import { describe, it, expect } from "vitest";
import { computeDueDate, computeInvoiceDate, isValidBillingMonth } from "../src/services/invoice.service";

describe("computeDueDate", () => {
  it("uses the client's billing day within the billing month", () => {
    const due = computeDueDate("2026-09", 5);
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(8); // 0-indexed September
    expect(due.getUTCDate()).toBe(5);
  });

  it("clamps the billing day to the last day of a shorter month (e.g. February)", () => {
    const due = computeDueDate("2026-02", 30);
    expect(due.getUTCMonth()).toBe(1);
    expect(due.getUTCDate()).toBe(28); // 2026 is not a leap year
  });

  it("handles a leap year February correctly", () => {
    const due = computeDueDate("2028-02", 30);
    expect(due.getUTCDate()).toBe(29);
  });
});

describe("computeInvoiceDate", () => {
  it("returns the first day of the billing month", () => {
    const date = computeInvoiceDate("2026-11");
    expect(date.getUTCMonth()).toBe(10);
    expect(date.getUTCDate()).toBe(1);
  });
});

describe("isValidBillingMonth", () => {
  it("accepts YYYY-MM", () => {
    expect(isValidBillingMonth("2026-09")).toBe(true);
    expect(isValidBillingMonth("2026-12")).toBe(true);
  });

  it("rejects malformed values", () => {
    expect(isValidBillingMonth("2026-13")).toBe(false);
    expect(isValidBillingMonth("2026-00")).toBe(false);
    expect(isValidBillingMonth("September 2026")).toBe(false);
    expect(isValidBillingMonth("")).toBe(false);
  });
});
