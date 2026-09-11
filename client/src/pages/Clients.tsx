import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal, Users, Eye, Pencil, Receipt, FileText, Archive, RotateCcw } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useArchiveClient, useClients, useReactivateClient } from "@/hooks/useClients";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog";
import { InvoiceFormDialog } from "@/components/invoices/InvoiceFormDialog";
import type { ClientSummary } from "@shared/types";

export default function Clients() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [activeOnly, setActiveOnly] = React.useState(true);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useClients({ page, pageSize: 20, search: debouncedSearch, activeOnly });

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<ClientSummary | undefined>();
  const [paymentClientId, setPaymentClientId] = React.useState<string | undefined>();
  const [invoiceClientId, setInvoiceClientId] = React.useState<string | undefined>();
  const [archiveTarget, setArchiveTarget] = React.useState<ClientSummary | undefined>();

  const archiveMutation = useArchiveClient();
  const reactivateMutation = useReactivateClient();

  React.useEffect(() => setPage(1), [debouncedSearch, activeOnly]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clients"
        description="Manage client records and monthly billing details."
        actions={
          <Button
            onClick={() => {
              setEditingClient(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, company, phone, email…" className="sm:max-w-sm" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={activeOnly} onCheckedChange={(v) => setActiveOnly(v === true)} />
          <Label className="cursor-pointer font-normal">Active clients only</Label>
        </label>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Monthly Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableSkeleton columns={9} />
            ) : data && data.items.length > 0 ? (
              data.items.map((client) => (
                <TableRow key={client._id} className="cursor-pointer" onClick={() => navigate(`/clients/${client._id}`)}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.clientId}</div>
                  </TableCell>
                  <TableCell>{client.company || "—"}</TableCell>
                  <TableCell>
                    <div>{client.phone || "—"}</div>
                    <div className="text-xs text-muted-foreground">{client.email}</div>
                  </TableCell>
                  <TableCell>{client.service || "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(client.monthlyFee)}</TableCell>
                  <TableCell>{client.currentMonthStatus ? <StatusBadge status={client.currentMonthStatus} /> : "—"}</TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={client.totalOutstanding > 0 ? "text-destructive" : ""}>
                      {formatCurrency(client.totalOutstanding)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(client.lastPaymentDate)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/clients/${client._id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> View / Payment History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingClient(client);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPaymentClientId(client._id)}>
                          <Receipt className="mr-2 h-4 w-4" /> Add Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setInvoiceClientId(client._id)}>
                          <FileText className="mr-2 h-4 w-4" /> Create Invoice
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {client.isActive ? (
                          <DropdownMenuItem className="text-destructive" onClick={() => setArchiveTarget(client)}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => reactivateMutation.mutate(client._id)}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState icon={Users} title="No clients found" description="Try adjusting your search, or add a new client to get started." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </Card>

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editingClient} />
      <RecordPaymentDialog open={!!paymentClientId} onOpenChange={(o) => !o && setPaymentClientId(undefined)} defaultClientId={paymentClientId} />
      <InvoiceFormDialog open={!!invoiceClientId} onOpenChange={(o) => !o && setInvoiceClientId(undefined)} defaultClientId={invoiceClientId} />

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(undefined)}
        title={`Archive ${archiveTarget?.name}?`}
        description="Archived clients are hidden from active lists but their billing history is preserved."
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
