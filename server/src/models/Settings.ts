import { Schema, model, type Model, type HydratedDocument } from "mongoose";

export interface SettingsAttrs {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  gstNumber?: string;
  logoUrl?: string;
  currency: string;
  defaultPaymentTerms: string;
  defaultDueDay: number;
  updatedAt: Date;
}

export type SettingsDocument = HydratedDocument<SettingsAttrs>;
type SettingsModel = Model<SettingsAttrs>;

const settingsSchema = new Schema<SettingsAttrs, SettingsModel>(
  {
    businessName: { type: String, required: true, default: "My Business" },
    businessEmail: { type: String, default: "" },
    businessPhone: { type: String, default: "" },
    businessAddress: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    defaultPaymentTerms: { type: String, default: "Due within 5 days of billing." },
    defaultDueDay: { type: Number, default: 5, min: 1, max: 28 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Settings = model<SettingsAttrs, SettingsModel>("Settings", settingsSchema, "settings");

const SETTINGS_SINGLETON_FILTER = {};

export async function getOrCreateSettings(): Promise<SettingsDocument> {
  const existing = await Settings.findOne(SETTINGS_SINGLETON_FILTER);
  if (existing) return existing;
  return Settings.create({});
}
