import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Receipt,
  FileText,
  Mail,
  Phone,
  Building2,
  Wallet,
  TrendingDown,
  CalendarClock,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClient, useClientInvoices } from "@/hooks/useClients";
import { formatCurrency, formatDate, billingMonthLabel } from "@/lib/utils";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";
import { InvoiceFormDialog } from "@/components/invoices/InvoiceFormDialog";
import type { Invoice } from "@shared/types";

const STATUS_OPTIONS = ["All", "Paid", "Partial", "Pending", "Overdue"];

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);

  const [year, setYear] = React.useState<string>("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const { data: invoices } = useClientInvoices(id, { year: year === "All" ? undefined : year });

  const [editOpen, setEditOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [invoiceOpen, setInvoiceOpen] = React.useState(false);

  const years = React.useMemo(() => {
    const set = new Set<string>();
    (invoices ?? []).forEach((inv: Invoice) => set.add(inv.billingMonth.slice(0, 4)));
    return Array.from(set).sort().reverse();
  }, [invoices]);

  const filteredInvoices = React.useMemo(() => {
    if (!invoices) return [];
    if (statusFilter === "All") return invoices;
    return invoices.filter((inv: Invoice) => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  if (isLoading || !client) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/clients")}>
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Button>

      <PageHeader
        title={client.name}
        description={[client.clientId, client.company].filter(Boolean).join(" · ")}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setInvoiceOpen(true)}>
              <FileText className="h-4 w-4" />
              Create Invoice
            </Button>
            <Button onClick={() => setPaymentOpen(true)}>
              <Receipt className="h-4 w-4" />
              Add Payment
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {client.phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {client.phone}
          </span>
        )}
        {client.email && (
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> {client.email}
          </span>
        )}
        {client.service && (
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> {client.service}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Monthly Fee</p>
            <p className="mt-1.5 text-lg font-semibold">{formatCurrency(client.monthlyFee)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" /> Total Paid
            </p>
            <p className="mt-1.5 text-lg font-semibold text-success">{formatCurrency(client.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <TrendingDown className="h-3.5 w-3.5" /> Total Outstanding
            </p>
            <p className="mt-1.5 text-lg font-semibold text-destructive">{formatCurrency(client.totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Last Payment
            </p>
            <p className="mt-1.5 text-lg font-semibold">{formatDate(client.lastPaymentDate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Current Month Status</p>
            <div className="mt-2">
              {client.currentMonthStatus ? <StatusBadge status={client.currentMonthStatus} /> : <span className="text-sm text-muted-foreground">No invoice yet</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Payment History</h2>
          <div className="flex gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Billing Month</TableHead>
                <TableHead>Invoice No.</TableHead>
                <TableHead className="text-right">Monthly Fee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice: Invoice) => (
                  <TableRow key={invoice._id} className="cursor-pointer" onClick={() => navigate(`/invoices/${invoice._id}`)}>
                    <TableCell>{billingMonthLabel(invoice.billingMonth)}</TableCell>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.amountDue)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.amountPaid)}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={invoice.balance > 0 ? "text-destructive" : ""}>{formatCurrency(invoice.balance)}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice._id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Invoice
                          </DropdownMenuItem>
                          {invoice.balance > 0 && (
                            <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice._id}`)}>
                              <Receipt className="mr-2 h-4 w-4" /> Record Payment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState icon={FileText} title="No invoices yet" description="Create the first monthly invoice for this client." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
      <RecordPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} defaultClientId={client._id} />
      <InvoiceFormDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} defaultClientId={client._id} />
    </div>
  );
}
