export const PAYMENT_STATUSES = ["Paid", "Partial", "Pending", "Overdue"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_MODES = ["Cash", "Bank Transfer", "UPI", "Card", "Cheque", "Other"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const USER_ROLES = ["admin", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];
