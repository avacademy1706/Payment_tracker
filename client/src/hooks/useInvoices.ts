import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, InvoiceInput, PaginatedResult, Payment } from "@shared/types";

export interface InvoiceListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  clientId?: string;
  search?: string;
  billingMonth?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}

export function useInvoices(params: InvoiceListParams) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: PaginatedResult<Invoice> }>("/invoices", { params });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Invoice }>(`/invoices/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useInvoicePayments(id: string | undefined) {
  return useQuery({
    queryKey: ["invoices", id, "payments"],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Payment[] }>(`/invoices/${id}/payments`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: InvoiceInput) => {
      const res = await api.post("/invoices", input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Invoice created" });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to create invoice", description: getErrorMessage(error) }),
  });
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Partial<InvoiceInput>) => {
      const res = await api.put(`/invoices/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Invoice updated" });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to update invoice", description: getErrorMessage(error) }),
  });
}

export function useArchiveInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/invoices/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Invoice archived" });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to archive invoice", description: getErrorMessage(error) }),
  });
}
