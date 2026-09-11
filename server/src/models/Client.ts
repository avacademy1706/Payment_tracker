import { Schema, model, type Model, type HydratedDocument } from "mongoose";

export interface ClientAttrs {
  clientId: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  monthlyFee: number;
  defaultDueDay: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientDocument = HydratedDocument<ClientAttrs>;
type ClientModel = Model<ClientAttrs>;

const clientSchema = new Schema<ClientAttrs, ClientModel>(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    service: { type: String, trim: true, default: "" },
    monthlyFee: { type: Number, required: true, min: 0 },
    defaultDueDay: { type: Number, required: true, min: 1, max: 28, default: 5 },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clientSchema.index({ name: "text", company: "text", email: "text" });

export const Client = model<ClientAttrs, ClientModel>("Client", clientSchema, "clients");
