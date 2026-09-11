import { Router } from "express";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  archiveClient,
  reactivateClient,
  getClientInvoices,
} from "../controllers/client.controller";
import { validate } from "../middleware/validate.middleware";
import { clientInputSchema, clientUpdateSchema } from "../validators/client.validator";

const router = Router();

router.get("/", listClients);
router.post("/", validate(clientInputSchema), createClient);
router.get("/:id", getClient);
router.put("/:id", validate(clientUpdateSchema), updateClient);
router.delete("/:id", archiveClient);
router.post("/:id/reactivate", reactivateClient);
router.get("/:id/invoices", getClientInvoices);

export default router;
