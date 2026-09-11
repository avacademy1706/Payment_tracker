import { z } from "zod";

export const settingsUpdateSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required."),
  businessEmail: z.string().trim().optional().default(""),
  businessPhone: z.string().trim().optional().default(""),
  businessAddress: z.string().trim().optional().default(""),
  gstNumber: z.string().trim().optional().default(""),
  logoUrl: z.string().trim().optional().default(""),
  currency: z.string().trim().min(1).default("INR"),
  defaultPaymentTerms: z.string().trim().optional().default(""),
  defaultDueDay: z.coerce.number().int().min(1).max(28).default(5),
});
