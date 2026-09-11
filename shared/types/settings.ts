export interface BusinessSettings {
  _id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  gstNumber?: string;
  logoUrl?: string;
  currency: string;
  defaultPaymentTerms: string;
  defaultDueDay: number;
  updatedAt: string;
}

export type BusinessSettingsInput = Omit<BusinessSettings, "_id" | "updatedAt">;
