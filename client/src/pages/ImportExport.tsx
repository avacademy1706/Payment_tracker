import * as React from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePreviewImport, useConfirmImport, type ImportPreviewResult } from "@/hooks/useImportExport";
import { getErrorMessage } from "@/lib/api";

const EXPORT_LINKS: Array<{ label: string; href: string; description: string }> = [
  { label: "All Clients", href: "/api/export/clients", description: "Every client record with contact and billing details." },
  { label: "All Payments", href: "/api/export/payments", description: "Every recorded payment transaction." },
  { label: "Current Month Invoices", href: "/api/export/invoices?scope=currentMonth", description: "Invoices billed in the current month." },
  { label: "Overdue Invoices", href: "/api/export/invoices?scope=overdue", description: "Invoices past due with an outstanding balance." },
  { label: "Outstanding Invoices", href: "/api/export/invoices?scope=outstanding", description: "All invoices with any balance remaining." },
  { label: "All Invoices", href: "/api/export/invoices", description: "The complete invoice history." },
];

export default function ImportExport() {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<ImportPreviewResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const previewMutation = usePreviewImport();
  const confirmMutation = useConfirmImport();

  const handleFileChange = (f: File | null) => {
    setFile(f);
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!file) return;
    try {
      const result = await previewMutation.mutateAsync(file);
      setPreview(result);
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to read file", description: getErrorMessage(error, "Invalid Excel format.") });
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    try {
      const result = await confirmMutation.mutateAsync(file);
      toast({
        title: "Import complete",
        description: `Imported ${result.imported} record(s), skipped ${result.skipped}, ${result.errors} error(s).`,
      });
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast({ variant: "destructive", title: "Import failed", description: getErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Import / Export" description="Bring in historical Excel data, or export current records." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Import from Excel
          </CardTitle>
          <CardDescription>
            Upload a .xlsx file using the standard columns (Client ID, Client Name, Company/Institute, Contact Number, Email,
            Service/Course, Monthly Fee, Billing Month, Invoice No., Payment Due Date, Payment Date, Payment Status, Payment
            Mode, Amount Paid, Balance, Remarks). Nothing is written until you confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
            <Button onClick={handlePreview} disabled={!file || previewMutation.isPending}>
              {previewMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Preview Import
            </Button>
          </div>

          {preview && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <SummaryPill icon={FileSpreadsheet} label="Total Rows" value={preview.totalRows} />
                <SummaryPill icon={CheckCircle2} label="Valid" value={preview.valid} tone="success" />
                <SummaryPill icon={AlertCircle} label="Duplicates" value={preview.duplicates} tone="warning" />
                <SummaryPill icon={XCircle} label="Errors" value={preview.errors} tone="destructive" />
              </div>

              {(preview.errors > 0 || preview.duplicates > 0) && (
                <div className="max-h-64 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows
                        .filter((r) => r.status !== "valid")
                        .map((row) => (
                          <TableRow key={row.rowNumber}>
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell>
                              <Badge variant={row.status === "error" ? "destructive" : "warning"}>{row.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{row.errors.join(" ")}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleConfirm} disabled={preview.valid === 0 || confirmMutation.isPending}>
                  {confirmMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Import ({preview.valid} record{preview.valid === 1 ? "" : "s"})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export to Excel
          </CardTitle>
          <CardDescription>Download a clean, Excel-compatible spreadsheet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPORT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex flex-col gap-1 rounded-md border p-3 text-sm transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="font-medium">{link.label}</span>
                <span className="text-xs text-muted-foreground">{link.description}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      <Icon className={"h-4 w-4 " + toneClass} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={"text-sm font-semibold " + toneClass}>{value}</p>
      </div>
    </div>
  );
}
