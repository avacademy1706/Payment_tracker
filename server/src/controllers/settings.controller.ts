import type { Request, Response } from "express";
import { getOrCreateSettings } from "../models/Settings";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getOrCreateSettings();
  sendSuccess(res, settings);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const existing = await getOrCreateSettings();
  Object.assign(existing, req.body);
  await existing.save();
  sendSuccess(res, existing, "Settings updated.");
});
