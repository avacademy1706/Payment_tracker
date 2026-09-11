import { describe, it, expect } from "vitest";
import { computeStatus, computeMoney, daysOverdue, daysUntilDue, isPastDueDate } from "../src/services/status.service";

describe("computeMoney / computeStatus", () => {
  it("walks through the spec's canonical partial-payment example", () => {
    // Invoice ₹50,000, due date in the past.
    const dueDate = new Date("2026-01-05");
    const now = new Date("2026-02-01");

    let money = computeMoney(50000, 0);
    expect(money.balance).toBe(50000);
    expect(computeStatus(50000, 0, dueDate, now)).toBe("Overdue");

    money = computeMoney(50000, 20000);
    expect(money.balance).toBe(30000);
    expect(computeStatus(50000, 20000, dueDate, now)).toBe("Overdue");

    money = computeMoney(50000, 30000);
    expect(money.balance).toBe(20000);

    money = computeMoney(50000, 50000);
    expect(money.balance).toBe(0);
    expect(computeStatus(50000, 50000, dueDate, now)).toBe("Paid");
  });

  it("marks a fully paid invoice as Paid even if amountPaid slightly exceeds amountDue", () => {
    expect(computeStatus(20000, 20000.0001, new Date("2026-01-01"), new Date("2026-01-15"))).toBe("Paid");
  });

  it("treats an unpaid invoice with a future due date as Pending, not Overdue", () => {
    const dueDate = new Date("2026-09-20");
    const now = new Date("2026-09-11");
    expect(computeStatus(10000, 0, dueDate, now)).toBe("Pending");
  });

  it("treats a partially paid invoice with a future due date as Partial", () => {
    const dueDate = new Date("2026-09-20");
    const now = new Date("2026-09-11");
    expect(computeStatus(10000, 4000, dueDate, now)).toBe("Partial");
  });

  it("flips a Partial invoice to Overdue once the due date passes, never leaving it contradictorily Partial", () => {
    const dueDate = new Date("2026-09-05");
    const now = new Date("2026-09-11");
    expect(computeStatus(10000, 4000, dueDate, now)).toBe("Overdue");
  });

  it("does not consider the due date itself as overdue", () => {
    // Explicit "Z" (UTC) offsets — a bare "2026-09-11T09:00:00" is parsed in
    // the *local* timezone by the Date constructor, which would make this
    // test's outcome depend on the machine running it.
    const dueDate = new Date("2026-09-11T09:00:00Z");
    const now = new Date("2026-09-11T22:00:00Z");
    expect(isPastDueDate(dueDate, now)).toBe(false);
    expect(computeStatus(10000, 0, dueDate, now)).toBe("Pending");
  });

  it("considers the day after the due date as overdue", () => {
    const dueDate = new Date("2026-09-11");
    const now = new Date("2026-09-12T00:00:01Z");
    expect(isPastDueDate(dueDate, now)).toBe(true);
  });

  it("never lets balance go negative", () => {
    expect(computeMoney(1000, 5000).balance).toBe(0);
  });
});

describe("daysOverdue / daysUntilDue", () => {
  it("computes whole-day differences", () => {
    const dueDate = new Date("2026-09-01");
    const now = new Date("2026-09-11");
    expect(daysOverdue(dueDate, now)).toBe(10);
  });

  it("returns 0 days overdue when not yet overdue", () => {
    expect(daysOverdue(new Date("2026-09-20"), new Date("2026-09-11"))).toBe(0);
  });

  it("computes days remaining until a future due date", () => {
    expect(daysUntilDue(new Date("2026-09-20"), new Date("2026-09-11"))).toBe(9);
  });

  it("returns a negative number of days remaining once overdue", () => {
    expect(daysUntilDue(new Date("2026-09-01"), new Date("2026-09-11"))).toBe(-10);
  });
});
