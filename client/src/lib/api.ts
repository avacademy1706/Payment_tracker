import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

export interface ApiErrorShape {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const data = (error as AxiosError<ApiErrorShape>).response?.data;
    if (data?.message) return data.message;
    if (error.code === "ERR_NETWORK") return "Unable to reach the server. Please check your connection.";
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> | undefined {
  if (axios.isAxiosError(error)) {
    return (error as AxiosError<ApiErrorShape>).response?.data?.errors;
  }
  return undefined;
}
