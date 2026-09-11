import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal, Receipt, Ban, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePayments, useVoidPayment } from "@/hooks/usePayments";
import { formatCurrency, formatDate, billingMonthLabel } from "@/lib/utils";
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";
import { PAYMENT_MODES, type Payment, type Invoice, type ClientSummary } from "@shared/types";

export default function Payments() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [paymentMode, setPaymentMode] = React.useState("All");

  const { data, isLoading } = usePayments({
    page,
    pageSize: 20,
    paymentMode: paymentMode === "All" ? undefined : paymentMode,
  });

  const [formOpen, setFormOpen] = React.useState(false);
  const [voidTarget, setVoidTarget] = React.useState<Payment | undefined>();
  const voidMutation = useVoidPayment();

  React.useEffect(() => setPage(1), [paymentMode]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Every payment transaction recorded against an invoice."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={paymentMode} onValueChange={setPaymentMode}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Payment Modes</SelectItem>
            {PAYMENT_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Billing Month</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableSkeleton columns={8} />
            ) : data && data.items.length > 0 ? (
              data.items.map((payment) => {
                const invoice = payment.invoice as unknown as Invoice;
                const client = payment.client as unknown as ClientSummary;
                return (
                  <TableRow key={payment._id}>
                    <TableCell className="font-medium">{invoice?.invoiceNumber ?? "—"}</TableCell>
                    <TableCell>
                      <div>{client?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{client?.company}</div>
                    </TableCell>
                    <TableCell>{invoice?.billingMonth ? billingMonthLabel(invoice.billingMonth) : "—"}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.paymentMode}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.transactionReference || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {invoice?._id && (
                            <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice._id}`)}>
                              <FileText className="mr-2 h-4 w-4" /> View Invoice
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setVoidTarget(payment)}>
                            <Ban className="mr-2 h-4 w-4" /> Void Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState icon={Receipt} title="No payments found" description="Record a payment to get started." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </Card>

      <RecordPaymentDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={!!voidTarget}
        onOpenChange={(o) => !o && setVoidTarget(undefined)}
        title="Void this payment?"
        description="The payment stays in the audit trail marked as voided, and the invoice balance is recalculated."
        confirmLabel="Void Payment"
        destructive
        isLoading={voidMutation.isPending}
        onConfirm={() => {
          if (voidTarget) voidMutation.mutate(voidTarget._id, { onSuccess: () => setVoidTarget(undefined) });
        }}
      />
    </div>
  );
}
