import { Router } from "express";
import { exportClientsFile, exportPaymentsFile, exportInvoicesFile } from "../controllers/export.controller";

const router = Router();

router.get("/clients", exportClientsFile);
router.get("/payments", exportPaymentsFile);
router.get("/invoices", exportInvoicesFile);

export default router;
