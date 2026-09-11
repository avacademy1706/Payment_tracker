import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients } from "@/hooks/useClients";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { getFieldErrors } from "@/lib/api";

const schema = z.object({
  clientId: z.string().min(1, "Select a client."),
  billingMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a billing month."),
  amountDue: z.coerce.number().positive("Amount due must be greater than zero."),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
}

export function InvoiceFormDialog({ open, onOpenChange, defaultClientId }: InvoiceFormDialogProps) {
  const { data: clientsPage } = useClients({ pageSize: 500, activeOnly: true });
  const createMutation = useCreateInvoice();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { billingMonth: currentMonthValue() },
  });

  const selectedClientId = watch("clientId");
  const selectedClient = clientsPage?.items.find((c) => c._id === selectedClientId);

  React.useEffect(() => {
    if (open) {
      reset({ clientId: defaultClientId ?? "", billingMonth: currentMonthValue(), amountDue: 0, dueDate: "", notes: "" });
    }
  }, [open, defaultClientId, reset]);

  React.useEffect(() => {
    if (selectedClient) {
      setValue("amountDue", selectedClient.monthlyFee);
    }
  }, [selectedClient, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        clientId: values.clientId,
        billingMonth: values.billingMonth,
        amountDue: values.amountDue,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
        notes: values.notes,
      });
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
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>Generate a monthly billing record for a client. An invoice number is assigned automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!defaultClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsPage?.items.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                        {c.company ? ` — ${c.company}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="billingMonth">Billing Month *</Label>
              <Input id="billingMonth" type="month" {...register("billingMonth")} />
              {errors.billingMonth && <p className="text-xs text-destructive">{errors.billingMonth.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amountDue">Amount Due (₹) *</Label>
              <Input id="amountDue" type="number" min={0} step="0.01" {...register("amountDue")} />
              {errors.amountDue && <p className="text-xs text-destructive">{errors.amountDue.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dueDate">Due Date (optional override)</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              <p className="text-xs text-muted-foreground">Leave blank to use the client's default billing day.</p>
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
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
