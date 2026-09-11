import type { Request, Response } from "express";
import { parseAndValidate, commitImport } from "../services/excelImport.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

export const previewImport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Please choose an Excel file to import.");

  const result = await parseAndValidate(req.file.buffer);

  if (!result.columnsValid) {
    throw ApiError.badRequest(
      `The uploaded file is missing required columns: ${result.missingColumns.join(", ")}.`
    );
  }

  const valid = result.rows.filter((r) => r.status === "valid").length;
  const duplicates = result.rows.filter((r) => r.status === "duplicate").length;
  const errors = result.rows.filter((r) => r.status === "error").length;

  sendSuccess(res, {
    totalRows: result.rows.length,
    valid,
    duplicates,
    errors,
    rows: result.rows,
  });
});

export const confirmImport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Please choose an Excel file to import.");

  const result = await parseAndValidate(req.file.buffer);
  if (!result.columnsValid) {
    throw ApiError.badRequest(
      `The uploaded file is missing required columns: ${result.missingColumns.join(", ")}.`
    );
  }

  const summary = await commitImport(result);
  sendSuccess(
    res,
    summary,
    `Imported ${summary.imported} record(s). Skipped ${summary.skipped}. ${summary.errors} row(s) had errors.`
  );
});
