import { z } from "zod";

export const clientInputSchema = z.object({
  name: z.string().trim().min(2, "Client name must be at least 2 characters."),
  company: z.string().trim().optional().default(""),
  phone: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || /^[0-9+\-\s()]{7,20}$/.test(v), "Enter a valid phone number."),
  email: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address."),
  service: z.string().trim().optional().default(""),
  monthlyFee: z.coerce.number().min(0, "Monthly fee cannot be negative."),
  defaultDueDay: z.coerce.number().int().min(1).max(28).default(5),
  notes: z.string().trim().optional().default(""),
});

export const clientUpdateSchema = clientInputSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type ClientInputParsed = z.infer<typeof clientInputSchema>;
