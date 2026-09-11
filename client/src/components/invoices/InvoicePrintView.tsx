import { formatCurrency, formatDate, billingMonthLabel } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { BusinessSettings, Invoice, InvoiceClientRef, Payment } from "@shared/types";

interface InvoicePrintViewProps {
  invoice: Invoice;
  payments: Payment[];
  settings?: BusinessSettings;
}

export function InvoicePrintView({ invoice, payments, settings }: InvoicePrintViewProps) {
  const client = invoice.client as InvoiceClientRef;

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-sm text-slate-900 print:p-0">
      <div className="flex items-start justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-lg font-semibold text-white">
            {settings?.businessName?.[0] ?? "B"}
          </div>
          <div>
            <p className="text-base font-semibold">{settings?.businessName ?? "Your Business"}</p>
            {settings?.businessAddress && <p className="max-w-[220px] text-xs text-slate-500">{settings.businessAddress}</p>}
            {settings?.businessEmail && <p className="text-xs text-slate-500">{settings.businessEmail}</p>}
            {settings?.businessPhone && <p className="text-xs text-slate-500">{settings.businessPhone}</p>}
            {settings?.gstNumber && <p className="text-xs text-slate-500">GSTIN: {settings.gstNumber}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold uppercase tracking-wide text-slate-700">Invoice</p>
          <p className="mt-1 text-sm font-medium">{invoice.invoiceNumber}</p>
          <p className="text-xs text-slate-500">Invoice Date: {formatDate(invoice.invoiceDate)}</p>
          <p className="text-xs text-slate-500">Due Date: {formatDate(invoice.dueDate)}</p>
          <div className="mt-2">
            <StatusBadge status={invoice.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billed To</p>
          <p className="mt-1 font-medium">{client.name}</p>
          {client.company && <p className="text-slate-600">{client.company}</p>}
          {client.email && <p className="text-slate-600">{client.email}</p>}
          {client.phone && <p className="text-slate-600">{client.phone}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billing Details</p>
          <p className="mt-1 text-slate-600">Service: {client.service || "—"}</p>
          <p className="text-slate-600">Billing Month: {billingMonthLabel(invoice.billingMonth)}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-y bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pl-2">Description</th>
            <th className="py-2 pr-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-3 pl-2">
              {client.service || "Service"} — {billingMonthLabel(invoice.billingMonth)}
            </td>
            <td className="py-3 pr-2 text-right">{formatCurrency(invoice.amountDue, true)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end py-4">
        <div className="w-56 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Amount Due</span>
            <span>{formatCurrency(invoice.amountDue, true)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount Paid</span>
            <span>{formatCurrency(invoice.amountPaid, true)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
            <span>Balance</span>
            <span>{formatCurrency(invoice.balance, true)}</span>
          </div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="mt-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Payment History</p>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-1.5">Date</th>
                <th className="py-1.5">Mode</th>
                <th className="py-1.5">Reference</th>
                <th className="py-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-b border-slate-100">
                  <td className="py-1.5">{formatDate(p.paymentDate)}</td>
                  <td className="py-1.5">{p.paymentMode}</td>
                  <td className="py-1.5">{p.transactionReference || "—"}</td>
                  <td className="py-1.5 text-right">{formatCurrency(p.amount, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoice.notes && (
        <div className="mt-6 border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
          <p className="mt-1 text-slate-600">{invoice.notes}</p>
        </div>
      )}

      {settings?.defaultPaymentTerms && (
        <p className="mt-8 text-center text-xs text-slate-400">{settings.defaultPaymentTerms}</p>
      )}
    </div>
  );
}
