import * as React from "react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientWiseReport, useMonthlyCollectionReport, usePaymentModeReport } from "@/hooks/useReports";
import { formatCurrency, billingMonthLabel } from "@/lib/utils";

export default function Reports() {
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const params = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };

  const monthly = useMonthlyCollectionReport(params);
  const clientWise = useClientWiseReport(params);
  const paymentMode = usePaymentModeReport(params);

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Collection performance across months, clients and payment modes." />

      <Card className="flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="dateFrom">From</Label>
          <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateTo">To</Label>
          <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
      </Card>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Collection</TabsTrigger>
          <TabsTrigger value="clients">Client-wise</TabsTrigger>
          <TabsTrigger value="modes">Payment Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Collection Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthly.data && monthly.data.length > 0 ? (
                  monthly.data.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{billingMonthLabel(row.month)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.expected)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.collected)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.outstanding)}</TableCell>
                      <TableCell className="text-right">{row.collectionRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState icon={BarChart3} title="No data" description="No invoices found for this range." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total Billed</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientWise.data && clientWise.data.length > 0 ? (
                  clientWise.data.map((row) => (
                    <TableRow key={row.clientId}>
                      <TableCell>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.company}</div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalBilled)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalPaid)}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={row.outstanding > 0 ? "text-destructive" : ""}>{formatCurrency(row.outstanding)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState icon={BarChart3} title="No data" description="No invoices found for this range." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="modes">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Total Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMode.data && paymentMode.data.length > 0 ? (
                  paymentMode.data.map((row) => (
                    <TableRow key={row.paymentMode}>
                      <TableCell>{row.paymentMode}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.total)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <EmptyState icon={BarChart3} title="No data" description="No payments found for this range." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {paymentMode.data && paymentMode.data.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{paymentMode.data.reduce((s, r) => s + r.count, 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(paymentMode.data.reduce((s, r) => s + r.total, 0))}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
