import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PaginatedResult, Payment, PaymentInput } from "@shared/types";

export interface PaymentListParams {
  page?: number;
  pageSize?: number;
  clientId?: string;
  invoiceId?: string;
  paymentMode?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function usePayments(params: PaymentListParams) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: PaginatedResult<Payment> }>("/payments", { params });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });
}

function invalidateAfterPaymentChange(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["payments"] });
  queryClient.invalidateQueries({ queryKey: ["invoices"] });
  queryClient.invalidateQueries({ queryKey: ["clients"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["overdue"] });
  queryClient.invalidateQueries({ queryKey: ["upcoming-dues"] });
  queryClient.invalidateQueries({ queryKey: ["reports"] });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: PaymentInput) => {
      const res = await api.post("/payments", input);
      return res.data.data;
    },
    onSuccess: () => {
      invalidateAfterPaymentChange(queryClient);
      toast({ title: "Payment recorded", description: "The payment has been saved successfully." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to record payment", description: getErrorMessage(error) }),
  });
}

export function useUpdatePayment(id: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Partial<PaymentInput>) => {
      const res = await api.put(`/payments/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      invalidateAfterPaymentChange(queryClient);
      toast({ title: "Payment updated" });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to update payment", description: getErrorMessage(error) }),
  });
}

export function useVoidPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/payments/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      invalidateAfterPaymentChange(queryClient);
      toast({ title: "Payment voided" });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to void payment", description: getErrorMessage(error) }),
  });
}
