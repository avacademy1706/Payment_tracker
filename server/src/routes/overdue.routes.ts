import { Router } from "express";
import { listOverdue } from "../controllers/overdue.controller";

const router = Router();

router.get("/", listOverdue);

export default router;
