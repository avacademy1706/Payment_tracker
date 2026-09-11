import type { Request, Response } from "express";
import { exportClients, exportInvoices, exportPayments } from "../services/excelExport.service";
import { asyncHandler } from "../utils/asyncHandler";

function sendXlsx(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

export const exportClientsFile = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await exportClients();
  sendXlsx(res, buffer, "clients.xlsx");
});

export const exportPaymentsFile = asyncHandler(async (req: Request, res: Response) => {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
  const buffer = await exportPayments({ dateFrom, dateTo });
  sendXlsx(res, buffer, "payments.xlsx");
});

export const exportInvoicesFile = asyncHandler(async (req: Request, res: Response) => {
  const scope = (req.query.scope as string) || "all";
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const filter: Parameters<typeof exportInvoices>[0] = {};
  if (scope === "currentMonth") filter.billingMonth = currentMonth;
  if (scope === "overdue") filter.onlyOverdue = true;
  if (scope === "outstanding") filter.onlyOutstanding = true;
  if (scope === "custom") {
    if (req.query.dateFrom) filter.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filter.dateTo = new Date(req.query.dateTo as string);
  }

  const buffer = await exportInvoices(filter);
  sendXlsx(res, buffer, `invoices-${scope}.xlsx`);
});
