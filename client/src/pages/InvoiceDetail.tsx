import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicePrintView } from "@/components/invoices/InvoicePrintView";
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";
import { useInvoice, useInvoicePayments } from "@/hooks/useInvoices";
import { useSettings } from "@/hooks/useSettings";
import type { InvoiceClientRef } from "@shared/types";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: payments } = useInvoicePayments(id);
  const { data: settings } = useSettings();
  const [paymentOpen, setPaymentOpen] = React.useState(false);

  if (isLoading || !invoice) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  const client = invoice.client as InvoiceClientRef;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {invoice.balance > 0 && (
            <Button variant="outline" onClick={() => setPaymentOpen(true)}>
              <Receipt className="h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm print:border-0 print:shadow-none">
        <InvoicePrintView invoice={invoice} payments={payments ?? []} settings={settings} />
      </div>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        defaultClientId={client._id}
        defaultInvoiceId={invoice._id}
      />
    </div>
  );
}
