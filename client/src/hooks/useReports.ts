import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MonthlyCollectionRow {
  month: string;
  expected: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
}

export interface ClientWiseRow {
  clientId: string;
  name: string;
  company: string;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
}

export interface PaymentModeRow {
  paymentMode: string;
  total: number;
  count: number;
}

interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

export function useMonthlyCollectionReport(params: DateRangeParams) {
  return useQuery({
    queryKey: ["reports", "monthly", params],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: MonthlyCollectionRow[] }>("/reports/monthly", { params });
      return res.data.data;
    },
  });
}

export function useClientWiseReport(params: DateRangeParams) {
  return useQuery({
    queryKey: ["reports", "clients", params],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: ClientWiseRow[] }>("/reports/clients", { params });
      return res.data.data;
    },
  });
}

export function usePaymentModeReport(params: DateRangeParams) {
  return useQuery({
    queryKey: ["reports", "payment-modes", params],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: PaymentModeRow[] }>("/reports/payment-modes", { params });
      return res.data.data;
    },
  });
}
