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
import { useClients, useClientInvoices } from "@/hooks/useClients";
import { useRecordPayment } from "@/hooks/usePayments";
import { getFieldErrors } from "@/lib/api";
import { formatCurrency, toDateInputValue, billingMonthLabel } from "@/lib/utils";
import { PAYMENT_MODES, type Invoice } from "@shared/types";

const schema = z.object({
  clientId: z.string().min(1, "Select a client."),
  invoiceId: z.string().min(1, "Select an invoice."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  paymentDate: z.string().min(1, "Payment date is required."),
  paymentMode: z.enum(PAYMENT_MODES),
  transactionReference: z.string().optional(),
  remarks: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  defaultInvoiceId?: string;
}

export function RecordPaymentDialog({ open, onOpenChange, defaultClientId, defaultInvoiceId }: RecordPaymentDialogProps) {
  const { data: clientsPage } = useClients({ pageSize: 500, activeOnly: true });
  const recordMutation = useRecordPayment();

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
    defaultValues: { paymentDate: toDateInputValue(new Date()), paymentMode: "UPI" },
  });

  const clientId = watch("clientId");
  const { data: clientInvoices } = useClientInvoices(clientId || undefined);
  const outstandingInvoices: Invoice[] = (clientInvoices ?? []).filter((inv: Invoice) => inv.balance > 0);
  const selectedInvoice = outstandingInvoices.find((inv) => inv._id === watch("invoiceId"));

  React.useEffect(() => {
    if (open) {
      reset({
        clientId: defaultClientId ?? "",
        invoiceId: defaultInvoiceId ?? "",
        amount: 0,
        paymentDate: toDateInputValue(new Date()),
        paymentMode: "UPI",
        transactionReference: "",
        remarks: "",
      });
    }
  }, [open, defaultClientId, defaultInvoiceId, reset]);

  React.useEffect(() => {
    if (selectedInvoice) {
      setValue("amount", selectedInvoice.balance);
    }
  }, [selectedInvoice, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      await recordMutation.mutateAsync({
        invoiceId: values.invoiceId,
        amount: values.amount,
        paymentDate: new Date(values.paymentDate).toISOString(),
        paymentMode: values.paymentMode,
        transactionReference: values.transactionReference,
        remarks: values.remarks,
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
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Payments are tracked as individual transactions against an invoice's balance.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Controller
                control={control}
                name="clientId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("invoiceId", "");
                    }}
                    disabled={!!defaultClientId}
                  >
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

            <div className="space-y-1.5">
              <Label>Invoice *</Label>
              <Controller
                control={control}
                name="invoiceId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!clientId || !!defaultInvoiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder={clientId ? "Select an invoice" : "Pick a client first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {outstandingInvoices.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No outstanding invoices</div>
                      )}
                      {outstandingInvoices.map((inv) => (
                        <SelectItem key={inv._id} value={inv._id}>
                          {inv.invoiceNumber} — {billingMonthLabel(inv.billingMonth)} ({formatCurrency(inv.balance)} due)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.invoiceId && <p className="text-xs text-destructive">{errors.invoiceId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input id="amount" type="number" min={0.01} step="0.01" {...register("amount")} />
              {selectedInvoice && (
                <p className="text-xs text-muted-foreground">Outstanding balance: {formatCurrency(selectedInvoice.balance)}</p>
              )}
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate")} />
              {errors.paymentDate && <p className="text-xs text-destructive">{errors.paymentDate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Payment Mode *</Label>
              <Controller
                control={control}
                name="paymentMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transactionReference">Transaction / Reference ID</Label>
              <Input id="transactionReference" {...register("transactionReference")} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" rows={2} {...register("remarks")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
