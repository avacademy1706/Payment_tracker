import type { Request, Response } from "express";
import { getDashboard, parseDashboardFilter } from "../services/dashboard.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";

export const getDashboardData = asyncHandler(async (req: Request, res: Response) => {
  const filter = parseDashboardFilter(req.query as Record<string, unknown>);
  const data = await getDashboard(filter);
  sendSuccess(res, data);
});
