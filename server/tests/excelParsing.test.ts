import { describe, it, expect } from "vitest";
import { parseCurrency, parseDateCell, parseBillingMonth } from "../src/utils/excelParsing";

describe("parseCurrency", () => {
  it("parses plain numbers", () => {
    expect(parseCurrency(50000)).toBe(50000);
  });

  it("strips the rupee symbol and thousands separators", () => {
    expect(parseCurrency("₹1,25,000")).toBe(125000);
  });

  it("returns null for blank or non-numeric values", () => {
    expect(parseCurrency("")).toBeNull();
    expect(parseCurrency("not a number")).toBeNull();
  });
});

describe("parseDateCell", () => {
  it("parses native Date objects", () => {
    const date = parseDateCell(new Date("2026-09-05"));
    expect(date?.getFullYear()).toBe(2026);
  });

  it("parses dd/mm/yyyy strings", () => {
    const date = parseDateCell("05/09/2026");
    expect(date?.getDate()).toBe(5);
    expect(date?.getMonth()).toBe(8);
  });

  it("returns null for garbage input", () => {
    expect(parseDateCell("not a date")).toBeNull();
  });
});

describe("parseBillingMonth", () => {
  it("parses ISO YYYY-MM", () => {
    expect(parseBillingMonth("2026-09")).toBe("2026-09");
  });

  it("parses month name + year", () => {
    expect(parseBillingMonth("September 2026")).toBe("2026-09");
    expect(parseBillingMonth("Sep-2026")).toBe("2026-09");
  });

  it("parses mm/yyyy", () => {
    expect(parseBillingMonth("09/2026")).toBe("2026-09");
  });

  it("parses a Date object to its month", () => {
    expect(parseBillingMonth(new Date("2026-09-15"))).toBe("2026-09");
  });

  it("returns null for unparseable input", () => {
    expect(parseBillingMonth("whenever")).toBeNull();
    expect(parseBillingMonth("")).toBeNull();
  });
});
