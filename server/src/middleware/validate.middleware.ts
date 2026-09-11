import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || part;
        if (!errors[key]) errors[key] = issue.message;
      }
      next(ApiError.badRequest("Please fix the highlighted fields.", errors));
      return;
    }
    req[part] = result.data;
    next();
  };
}
