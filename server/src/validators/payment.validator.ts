import { z } from "zod";
import { PAYMENT_MODES } from "../../../shared/types/enums";

export const paymentInputSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  paymentDate: z.coerce.date({ message: "Enter a valid payment date." }),
  paymentMode: z.enum(PAYMENT_MODES),
  transactionReference: z.string().trim().optional().default(""),
  remarks: z.string().trim().optional().default(""),
});

export const paymentUpdateSchema = paymentInputSchema.partial().omit({ invoiceId: true });

export type PaymentInputParsed = z.infer<typeof paymentInputSchema>;
