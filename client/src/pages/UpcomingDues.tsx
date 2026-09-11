import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUpcomingDues } from "@/hooks/useOverdueUpcoming";
import { formatCurrency, formatDate, billingMonthLabel } from "@/lib/utils";
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";

interface UpcomingRow {
  _id: string;
  invoiceNumber: string;
  billingMonth: string;
  dueDate: string;
  balance: number;
  daysRemaining: number;
  client: { _id: string; clientId: string; name: string; company: string };
}

export default function UpcomingDues() {
  const navigate = useNavigate();
  const [days, setDays] = React.useState(7);
  const { data, isLoading } = useUpcomingDues(days);
  const [paymentTarget, setPaymentTarget] = React.useState<UpcomingRow | undefined>();

  const items = (data ?? []) as unknown as UpcomingRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Upcoming Dues"
        description="Invoices coming due soon so you can follow up ahead of time."
        actions={
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              <TabsTrigger value="7">7 days</TabsTrigger>
              <TabsTrigger value="15">15 days</TabsTrigger>
              <TabsTrigger value="30">30 days</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Days Remaining</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableSkeleton columns={6} />
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
                  <TableCell className="text-right font-medium">{formatCurrency(row.balance)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={row.daysRemaining <= 2 ? "warning" : "secondary"}>
                      {row.daysRemaining === 0 ? "Today" : `${row.daysRemaining}d`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setPaymentTarget(row)}>
                      <Receipt className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState icon={CalendarClock} title="Nothing due soon" description={`No invoices are due within ${days} days.`} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
