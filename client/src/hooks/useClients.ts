import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ClientInput, ClientSummary, PaginatedResult } from "@shared/types";

export interface ClientListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
}

export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: PaginatedResult<ClientSummary> }>("/clients", { params });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: ClientSummary }>(`/clients/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useClientInvoices(id: string | undefined, filters: { year?: string; month?: string } = {}) {
  return useQuery({
    queryKey: ["clients", id, "invoices", filters],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}/invoices`, { params: filters });
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const res = await api.post("/clients", input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client added", description: "The new client has been saved." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to save client", description: getErrorMessage(error) }),
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Partial<ClientInput> & { isActive?: boolean }) => {
      const res = await api.put(`/clients/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client updated" });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to update client", description: getErrorMessage(error) }),
  });
}

export function useArchiveClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/clients/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client archived" });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to archive client", description: getErrorMessage(error) }),
  });
}

export function useReactivateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/clients/${id}/reactivate`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client reactivated" });
    },
    onError: (error) => toast({ variant: "destructive", title: "Unable to reactivate client", description: getErrorMessage(error) }),
  });
}
