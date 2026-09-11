import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { authLimiter } from "../middleware/rateLimiter.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/register", requireAuth, requireRole("admin"), validate(registerSchema), register);

export default router;
