import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, MessageCircle, Mail, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOverdueInvoices } from "@/hooks/useOverdueUpcoming";
import { formatCurrency, formatDate, billingMonthLabel } from "@/lib/utils";
import { buildWhatsAppReminderUrl, buildEmailReminderUrl } from "@/lib/reminders";
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";

interface OverdueRow {
  _id: string;
  invoiceNumber: string;
  billingMonth: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  daysOverdue: number;
  client: { _id: string; clientId: string; name: string; company: string; phone: string; email: string };
}

export default function Overdue() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useOverdueInvoices({ page, pageSize: 20 });
  const [paymentTarget, setPaymentTarget] = React.useState<OverdueRow | undefined>();

  const items = (data?.items ?? []) as unknown as OverdueRow[];

  return (
    <div className="space-y-4">
      <PageHeader title="Overdue" description="Invoices whose due date has passed with an outstanding balance." />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Days Overdue</TableHead>
              <TableHead className="text-right">Total Due</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="w-64">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableSkeleton columns={9} />
            ) : items.length > 0 ? (
              items.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="cursor-pointer" onClick={() => navigate(`/clients/${row.client._id}`)}>
                    <div className="font-medium hover:underline">{row.client.name}</div>
                    <div className="text-xs text-muted-foreground">{row.client.company}</div>
                  </TableCell>
                  <TableCell>
                    <div>{row.invoiceNumber}</div>
                    <div className="text-xs text-muted-foreground">{billingMonthLabel(row.billingMonth)}</div>
                  </TableCell>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">{row.daysOverdue}d</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(row.amountDue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.amountPaid)}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">{formatCurrency(row.balance)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{row.client.phone}</div>
                    <div>{row.client.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setPaymentTarget(row)}>
                        <Receipt className="h-3.5 w-3.5" />
                      </Button>
                      {row.client.phone && (
                        <Button asChild size="sm" variant="outline">
                          <a href={buildWhatsAppReminderUrl(row.client.phone, row.client.name, row.balance, row.invoiceNumber, row.dueDate)} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {row.client.email && (
                        <Button asChild size="sm" variant="outline">
                          <a href={buildEmailReminderUrl(row.client.email, row.client.name, row.balance, row.invoiceNumber, row.dueDate)}>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState icon={AlertTriangle} title="Nothing overdue" description="All invoices are within their due dates." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </Card>

      {paymentTarget && (
        <RecordPaymentDialog
          open={!!paymentTarget}
          onOpenChange={(o) => !o && setPaymentTarget(undefined)}
          defaultClientId={paymentTarget.client._id}
          defaultInvoiceId={paymentTarget._id}
        />
      )}
    </div>
  );
}
