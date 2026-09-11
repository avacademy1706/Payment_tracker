export interface Client {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  name: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  monthlyFee: number;
  defaultDueDay: number;
  notes?: string;
}

export interface ClientSummary extends Client {
  totalOutstanding: number;
  totalPaid: number;
  lastPaymentDate: string | null;
  currentMonthStatus: string | null;
}
