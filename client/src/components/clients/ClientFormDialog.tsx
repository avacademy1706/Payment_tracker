import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateClient, useUpdateClient } from "@/hooks/useClients";
import { getFieldErrors } from "@/lib/api";
import type { ClientSummary } from "@shared/types";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters."),
  company: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  service: z.string().optional().default(""),
  monthlyFee: z.coerce.number().min(0, "Monthly fee cannot be negative."),
  defaultDueDay: z.coerce.number().int().min(1).max(28),
  notes: z.string().optional().default(""),
});
type FormValues = z.infer<typeof schema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientSummary;
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const isEdit = !!client;
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(client?._id ?? "");
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { defaultDueDay: 5, monthlyFee: 0 },
  });

  React.useEffect(() => {
    if (open) {
      reset(
        client
          ? {
              name: client.name,
              company: client.company,
              phone: client.phone,
              email: client.email,
              service: client.service,
              monthlyFee: client.monthlyFee,
              defaultDueDay: client.defaultDueDay,
              notes: client.notes ?? "",
            }
          : { name: "", company: "", phone: "", email: "", service: "", monthlyFee: 0, defaultDueDay: 5, notes: "" }
      );
    }
  }, [open, client, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync(values);
      onOpenChange(false);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof FormValues, { message });
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "Add Client"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this client's details." : "A unique Client ID will be generated automatically."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company / Institute</Label>
              <Input id="company" {...register("company")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service">Service / Course</Label>
              <Input id="service" {...register("service")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Contact Number</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthlyFee">Monthly Fee (₹) *</Label>
              <Input id="monthlyFee" type="number" min={0} step="0.01" {...register("monthlyFee")} />
              {errors.monthlyFee && <p className="text-xs text-destructive">{errors.monthlyFee.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="defaultDueDay">Billing Day / Default Due Day *</Label>
              <Input id="defaultDueDay" type="number" min={1} max={28} {...register("defaultDueDay")} />
              {errors.defaultDueDay && <p className="text-xs text-destructive">{errors.defaultDueDay.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
