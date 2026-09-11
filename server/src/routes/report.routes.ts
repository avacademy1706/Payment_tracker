import { Router } from "express";
import { monthlyCollectionReport, clientWiseReport, paymentModeReport } from "../controllers/report.controller";

const router = Router();

router.get("/monthly", monthlyCollectionReport);
router.get("/clients", clientWiseReport);
router.get("/payment-modes", paymentModeReport);

export default router;
