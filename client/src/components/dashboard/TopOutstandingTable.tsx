import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils";
import type { OutstandingClientPoint } from "@shared/types";
import { TrendingUp } from "lucide-react";

export function TopOutstandingTable({ data }: { data: OutstandingClientPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Highest Outstanding Balances</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState icon={TrendingUp} title="Nothing outstanding" description="Every client is fully paid up." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link to={`/clients/${row.id}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    {row.company && <p className="text-xs text-muted-foreground">{row.company}</p>}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatCurrency(row.outstanding)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
