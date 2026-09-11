const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/** Excel serial date epoch (1899-12-30, accounting for the 1900 leap-year bug). */
function excelSerialToDate(serial: number): Date {
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(utcMs);
}

export function parseCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function parseCurrency(value: unknown): number | null {
  const str = parseCell(value).replace(/[₹,\s]/g, "");
  if (str === "") return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

export function parseDateCell(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const date = excelSerialToDate(value);
    return isNaN(date.getTime()) ? null : date;
  }
  const str = parseCell(value);

  // Check the DD/MM/YYYY (Indian/Excel convention) pattern before falling
  // back to native Date parsing: `new Date("05/09/2026")` would otherwise
  // silently parse it as the US MM/DD/YYYY convention (September... no,
  // May 9th) and return a plausible-looking but wrong date instead of
  // failing loudly.
  const slashMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    const year = y.length === 2 ? Number(y) + 2000 : Number(y);
    const date = new Date(Date.UTC(year, Number(m) - 1, Number(d)));
    if (!isNaN(date.getTime())) return date;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

/** Accepts "2026-09", "09/2026", "September 2026", "Sep-2026", or a date/serial and returns "YYYY-MM". */
export function parseBillingMonth(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) return toMonthKey(value);
  if (typeof value === "number") return toMonthKey(excelSerialToDate(value));

  const str = parseCell(value);

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}`;

  const slashMatch = str.match(/^(\d{1,2})[/-](\d{4})$/);
  if (slashMatch) return `${slashMatch[2]}-${slashMatch[1].padStart(2, "0")}`;

  const wordMatch = str.match(/^([A-Za-z]+)[\s-]+(\d{4})$/);
  if (wordMatch) {
    const monthIndex = MONTH_NAMES.findIndex((m) => m.startsWith(wordMatch[1].toLowerCase().slice(0, 3)));
    if (monthIndex >= 0) return `${wordMatch[2]}-${String(monthIndex + 1).padStart(2, "0")}`;
  }

  const asDate = parseDateCell(value);
  if (asDate) return toMonthKey(asDate);

  return null;
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
