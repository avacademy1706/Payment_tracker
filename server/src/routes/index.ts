import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import authRoutes from "./auth.routes";
import clientRoutes from "./client.routes";
import invoiceRoutes from "./invoice.routes";
import paymentRoutes from "./payment.routes";
import dashboardRoutes from "./dashboard.routes";
import overdueRoutes from "./overdue.routes";
import upcomingRoutes from "./upcoming.routes";
import reportRoutes from "./report.routes";
import importRoutes from "./import.routes";
import exportRoutes from "./export.routes";
import settingsRoutes from "./settings.routes";

const router = Router();

// /api/auth/login and /api/auth/logout are public; everything else in this
// router requires an authenticated session (enforced inside auth.routes.ts).
router.use("/auth", authRoutes);

router.use(requireAuth);
router.use("/clients", clientRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/overdue", overdueRoutes);
router.use("/upcoming-dues", upcomingRoutes);
router.use("/reports", reportRoutes);
router.use("/import", importRoutes);
router.use("/export", exportRoutes);
router.use("/settings", settingsRoutes);

export default router;
