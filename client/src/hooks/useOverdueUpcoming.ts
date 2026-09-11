import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResult } from "@shared/types";

export function useOverdueInvoices(params: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["overdue", params],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: PaginatedResult<Record<string, unknown>> }>("/overdue", { params });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useUpcomingDues(days: number) {
  return useQuery({
    queryKey: ["upcoming-dues", days],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Record<string, unknown>[] }>("/upcoming-dues", { params: { days } });
      return res.data.data;
    },
  });
}
