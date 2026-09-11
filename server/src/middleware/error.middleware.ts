import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    for (const [field, validatorError] of Object.entries(err.errors)) {
      errors[field] = validatorError.message;
    }
    res.status(400).json({ success: false, message: "Validation failed.", errors });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: `Invalid value for field "${err.path}".` });
    return;
  }

  if (isMongoDuplicateKeyError(err)) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    res.status(409).json({ success: false, message: `A record with this ${field} already exists.` });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[unhandled error]", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    ...(env.isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
  });
}

function isMongoDuplicateKeyError(err: unknown): err is { code: number; keyPattern?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000;
}
