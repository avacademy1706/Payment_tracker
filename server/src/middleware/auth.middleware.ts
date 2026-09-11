import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { verifyToken } from "../services/token.service";
import { ApiError } from "../utils/ApiError";
import type { UserRole } from "../../../shared/types/enums";

function extractToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[env.cookieName];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);

  return undefined;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(ApiError.unauthorized("Please sign in to continue."));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(ApiError.unauthorized("Your session has expired. Please sign in again."));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden("You do not have permission to perform this action."));
      return;
    }
    next();
  };
}
