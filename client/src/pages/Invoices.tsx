import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal, FileText, Receipt, Eye, Printer, Archive } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArchiveInvoice, useInvoices } from "@/hooks/useInvoices";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDate, billingMonthLabel } from "@/lib/utils";
import { InvoiceFormDialog } from "@/components/invoices/InvoiceFormDialog";
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";
import type { Invoice, InvoiceClientRef } from "@shared/types";

const STATUS_OPTIONS = ["All", "Paid", "Partial", "Pending", "Overdue"];
const SORT_OPTIONS: Record<string, string> = {
  newest: "Newest",
  oldest: "Oldest",
  dueDate: "Due Date",
  balanceHigh: "Highest Balance",
  balanceLow: "Lowest Balance",
};

export default function Invoices() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("All");
  const [sort, setSort] = React.useState("newest");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useInvoices({ page, pageSize: 20, search: debouncedSearch, status, sort });

  const [formOpen, setFormOpen] = React.useState(false);
  const [paymentInvoice, setPaymentInvoice] = React.useState<Invoice | undefined>();
  const [archiveTarget, setArchiveTarget] = React.useState<Invoice | undefined>();

  const archiveMutation = useArchiveInvoice();

  React.useEffect(() => setPage(1), [debouncedSearch, status, sort]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoices"
        description="Monthly billing records generated for each client."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by invoice no., client, company…" className="sm:max-w-sm" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
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
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Billing Month</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableSkeleton columns={9} />
            ) : data && data.items.length > 0 ? (
              data.items.map((invoice) => {
                const client = invoice.client as InvoiceClientRef;
                return (
                  <TableRow key={invoice._id} className="cursor-pointer" onClick={() => navigate(`/invoices/${invoice._id}`)}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.company}</div>
                    </TableCell>
                    <TableCell>{billingMonthLabel(invoice.billingMonth)}</TableCell>
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
                            <Eye className="mr-2 h-4 w-4" /> View / Print
                          </DropdownMenuItem>
                          {invoice.balance > 0 && (
                            <DropdownMenuItem onClick={() => setPaymentInvoice(invoice)}>
                              <Receipt className="mr-2 h-4 w-4" /> Record Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice._id}?print=1`)}>
                            <Printer className="mr-2 h-4 w-4" /> Print Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setArchiveTarget(invoice)}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState icon={FileText} title="No invoices found" description="Try adjusting your filters, or create a new invoice." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </Card>

      <InvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} />
      {paymentInvoice && (
        <RecordPaymentDialog
          open={!!paymentInvoice}
          onOpenChange={(o) => !o && setPaymentInvoice(undefined)}
          defaultClientId={(paymentInvoice.client as InvoiceClientRef)._id}
          defaultInvoiceId={paymentInvoice._id}
        />
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(undefined)}
        title={`Archive invoice ${archiveTarget?.invoiceNumber}?`}
        description="Archived invoices are hidden from active lists but remain in the audit trail."
        confirmLabel="Archive"
        destructive
        isLoading={archiveMutation.isPending}
        onConfirm={() => {
          if (archiveTarget) archiveMutation.mutate(archiveTarget._id, { onSuccess: () => setArchiveTarget(undefined) });
        }}
      />
    </div>
  );
}
