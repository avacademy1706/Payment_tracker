import { Router } from "express";
import { createPayment, listPayments, getPayment, editPayment, deletePayment } from "../controllers/payment.controller";
import { validate } from "../middleware/validate.middleware";
import { paymentInputSchema, paymentUpdateSchema } from "../validators/payment.validator";

const router = Router();

router.get("/", listPayments);
router.post("/", validate(paymentInputSchema), createPayment);
router.get("/:id", getPayment);
router.put("/:id", validate(paymentUpdateSchema), editPayment);
router.delete("/:id", deletePayment);

export default router;
