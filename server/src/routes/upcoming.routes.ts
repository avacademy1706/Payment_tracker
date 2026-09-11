import { Router } from "express";
import { listUpcoming } from "../controllers/upcoming.controller";

const router = Router();

router.get("/", listUpcoming);

export default router;
