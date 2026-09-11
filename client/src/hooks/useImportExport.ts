import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ImportRowResult {
  rowNumber: number;
  status: "valid" | "error" | "duplicate";
  errors: string[];
  raw: Record<string, unknown>;
}

export interface ImportPreviewResult {
  totalRows: number;
  valid: number;
  duplicates: number;
  errors: number;
  rows: ImportRowResult[];
}

export interface ImportCommitResult {
  imported: number;
  skipped: number;
  errors: number;
  clientsCreated: number;
}

function toFormData(file: File): FormData {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

export function usePreviewImport() {
  return useMutation({
    mutationFn: async (file: File) => {
      const res = await api.post<{ success: true; data: ImportPreviewResult }>("/import/excel/preview", toFormData(file), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    },
  });
}

export function useConfirmImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const res = await api.post<{ success: true; data: ImportCommitResult }>("/import/excel/confirm", toFormData(file), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
