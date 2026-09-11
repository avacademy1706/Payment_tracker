import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../../../shared/types/enums";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
