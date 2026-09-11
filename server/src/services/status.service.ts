import type { PaymentStatus } from "../../../shared/types/enums";

export interface InvoiceMoney {
  amountDue: number;
  amountPaid: number;
  balance: number;
}

/**
 * Single source of truth for turning (amountDue, amountPaid, dueDate) into a
 * balance + status. This is intentionally a pure function with no DB access
 * so it can be unit tested exhaustively and reused by the dashboard, the
 * invoice list, the overdue view, and the Excel import validator without
 * risk of the rules drifting apart between call sites.
 *
 * Priority order (avoids contradictory states):
 *   1. balance <= 0            -> Paid
 *   2. due date has passed     -> Overdue (even if partially paid)
 *   3. amountPaid > 0          -> Partial
 *   4. otherwise               -> Pending
 */
export function computeStatus(amountDue: number, amountPaid: number, dueDate: Date, now: Date = new Date()): PaymentStatus {
  const balance = roundCurrency(amountDue - amountPaid);

  if (balance <= 0) return "Paid";
  if (isPastDueDate(dueDate, now)) return "Overdue";
  if (amountPaid > 0) return "Partial";
  return "Pending";
}

export function computeMoney(amountDue: number, amountPaid: number): InvoiceMoney {
  const balance = Math.max(0, roundCurrency(amountDue - amountPaid));
  return { amountDue: roundCurrency(amountDue), amountPaid: roundCurrency(amountPaid), balance };
}

/**
 * All day-boundary math below uses UTC getters/setters rather than local
 * ones. Due dates are always constructed at UTC midnight (see
 * invoice.service.ts#computeDueDate), so comparing them with local-time
 * boundaries would make the result depend on the server's timezone —
 * e.g. a due date could flip from "not overdue" to "overdue" a few hours
 * earlier or later than intended purely because of where the process runs.
 * UTC keeps "today" and "the due date" anchored to the same calendar day
 * everywhere.
 */

/** Due date has "passed" once the calendar day after dueDate begins. */
export function isPastDueDate(dueDate: Date, now: Date = new Date()): boolean {
  const dueEndOfDay = new Date(dueDate);
  dueEndOfDay.setUTCHours(23, 59, 59, 999);
  return now.getTime() > dueEndOfDay.getTime();
}

/** Whole calendar days between `now` and `dueDate`; positive while still upcoming, negative once overdue. */
export function daysUntilDue(dueDate: Date, now: Date = new Date()): number {
  const dueStartOfDay = new Date(dueDate);
  dueStartOfDay.setUTCHours(0, 0, 0, 0);
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  return Math.round((dueStartOfDay.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysOverdue(dueDate: Date, now: Date = new Date()): number {
  return Math.max(0, -daysUntilDue(dueDate, now));
}

/** Avoids floating point artifacts like 19999.999999999996 in currency math. */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
