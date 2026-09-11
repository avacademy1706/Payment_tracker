import { Router } from "express";
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  archiveInvoice,
  getInvoicePayments,
  recalculateInvoiceBalance,
} from "../controllers/invoice.controller";
import { validate } from "../middleware/validate.middleware";
import { invoiceInputSchema, invoiceUpdateSchema } from "../validators/invoice.validator";

const router = Router();

router.get("/", listInvoices);
router.post("/", validate(invoiceInputSchema), createInvoice);
router.get("/:id", getInvoice);
router.put("/:id", validate(invoiceUpdateSchema), updateInvoice);
router.delete("/:id", archiveInvoice);
router.get("/:id/payments", getInvoicePayments);
router.post("/:id/recalculate", recalculateInvoiceBalance);

export default router;
