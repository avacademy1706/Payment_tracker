import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller";
import { validate } from "../middleware/validate.middleware";
import { settingsUpdateSchema } from "../validators/settings.validator";

const router = Router();

router.get("/", getSettings);
router.put("/", validate(settingsUpdateSchema), updateSettings);

export default router;
