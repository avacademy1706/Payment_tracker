import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signToken } from "../services/token.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import type { LoginInput, RegisterInput } from "../validators/auth.validator";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function toSafeUser(user: { _id: unknown; name: string; email: string; role: string }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const token = signToken({ id: String(user._id), email: user.email, name: user.name, role: user.role });
  res.cookie(env.cookieName, token, COOKIE_OPTIONS);
  sendSuccess(res, { user: toSafeUser(user), token }, "Signed in successfully.");
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.cookieName, { ...COOKIE_OPTIONS, maxAge: undefined });
  sendSuccess(res, null, "Signed out.");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  sendSuccess(res, { user: req.user });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: "staff" });

  sendCreated(res, { user: toSafeUser(user) }, "User created.");
});
