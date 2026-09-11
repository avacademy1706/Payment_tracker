import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardResponse } from "@shared/types";

export interface DashboardParams {
  period: "currentMonth" | "previousMonth" | "currentYear" | "custom";
  dateFrom?: string;
  dateTo?: string;
}

export function useDashboard(params: DashboardParams) {
  return useQuery({
    queryKey: ["dashboard", params],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: DashboardResponse }>("/dashboard", { params });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });
}
