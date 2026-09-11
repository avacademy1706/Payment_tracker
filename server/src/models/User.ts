import { Schema, model, type Model, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import type { UserRole } from "../../../shared/types/enums";

export interface UserAttrs {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<UserAttrs, UserMethods>;
type UserModel = Model<UserAttrs, object, UserMethods>;

const userSchema = new Schema<UserAttrs, UserModel, UserMethods>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "staff"], default: "admin" },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = model<UserAttrs, UserModel>("User", userSchema, "users");
