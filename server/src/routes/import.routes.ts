import { Router } from "express";
import { previewImport, confirmImport } from "../controllers/import.controller";
import { excelUpload } from "../middleware/upload.middleware";

const router = Router();

router.post("/excel/preview", excelUpload.single("file"), previewImport);
router.post("/excel/confirm", excelUpload.single("file"), confirmImport);

export default router;
