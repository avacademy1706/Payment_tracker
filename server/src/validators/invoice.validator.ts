import { z } from "zod";

const billingMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing month must be in YYYY-MM format.");

export const invoiceInputSchema = z.object({
  clientId: z.string().min(1, "Client is required."),
  billingMonth: billingMonthSchema,
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  amountDue: z.coerce.number().positive("Amount due must be greater than zero."),
  notes: z.string().trim().optional().default(""),
});

export const invoiceUpdateSchema = z.object({
  dueDate: z.coerce.date().optional(),
  amountDue: z.coerce.number().positive("Amount due must be greater than zero.").optional(),
  notes: z.string().trim().optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
  status: z.enum(["Paid", "Partial", "Pending", "Overdue", "All"]).optional(),
  clientId: z.string().optional(),
  search: z.string().optional(),
  billingMonth: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z.enum(["newest", "oldest", "balanceHigh", "balanceLow", "dueDate"]).optional(),
});

export type InvoiceInputParsed = z.infer<typeof invoiceInputSchema>;
