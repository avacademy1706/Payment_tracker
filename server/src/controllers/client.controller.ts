import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Client } from "../models/Client";
import { Invoice } from "../models/Invoice";
import { generateClientId } from "../services/clientId.service";
import { getClientFinancialSummaries } from "../services/client.service";
import { withInvoiceComputedFields } from "../services/invoice.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../utils/pagination";
import type { ClientInputParsed } from "../validators/client.validator";

export const listClients = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const search = (req.query.search as string | undefined)?.trim();
  const activeOnly = req.query.activeOnly === "true";

  const filter: mongoose.FilterQuery<typeof Client.schema.obj> = {};
  if (activeOnly) filter.isActive = true;
  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { clientId: { $regex: escapeRegex(search), $options: "i" } },
      { company: { $regex: escapeRegex(search), $options: "i" } },
      { phone: { $regex: escapeRegex(search), $options: "i" } },
      { email: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }

  const [clients, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.pageSize),
    Client.countDocuments(filter),
  ]);

  const summaries = await getClientFinancialSummaries(clients.map((c) => c._id));

  const items = clients.map((client) => ({
    ...client.toObject(),
    ...summaries.get(client._id.toString()),
  }));

  sendSuccess(res, buildPaginatedResult(items, total, pagination));
});

export const getClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw ApiError.notFound("Client not found.");

  const summaries = await getClientFinancialSummaries([client._id]);
  sendSuccess(res, { ...client.toObject(), ...summaries.get(client._id.toString()) });
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ClientInputParsed;
  const clientId = await generateClientId();
  const client = await Client.create({ ...input, clientId });
  sendCreated(res, client, "Client added successfully.");
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!client) throw ApiError.notFound("Client not found.");
  sendSuccess(res, client, "Client updated successfully.");
});

export const archiveClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!client) throw ApiError.notFound("Client not found.");
  sendSuccess(res, client, "Client archived.");
});

export const reactivateClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  if (!client) throw ApiError.notFound("Client not found.");
  sendSuccess(res, client, "Client reactivated.");
});

export const getClientInvoices = asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw ApiError.notFound("Client not found.");

  const filter: mongoose.FilterQuery<typeof Invoice.schema.obj> = { client: client._id, isArchived: false };
  if (req.query.year) {
    filter.billingMonth = { $regex: `^${req.query.year}-` };
  }
  if (req.query.month) {
    filter.billingMonth = req.query.month as string;
  }

  const invoices = await Invoice.find(filter).sort({ billingMonth: -1 });
  sendSuccess(res, invoices.map((inv) => withInvoiceComputedFields(inv.toObject())));
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
