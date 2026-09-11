import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";

const schema = z.object({
  businessName: z.string().min(1, "Business name is required."),
  businessEmail: z.string().optional().default(""),
  businessPhone: z.string().optional().default(""),
  businessAddress: z.string().optional().default(""),
  gstNumber: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  currency: z.string().min(1),
  defaultPaymentTerms: z.string().optional().default(""),
  defaultDueDay: z.coerce.number().int().min(1).max(28),
});
type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (data) {
      reset({
        businessName: data.businessName,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        businessAddress: data.businessAddress,
        gstNumber: data.gstNumber,
        logoUrl: data.logoUrl,
        currency: data.currency,
        defaultPaymentTerms: data.defaultPaymentTerms,
        defaultDueDay: data.defaultDueDay,
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: FormValues) => {
    await updateMutation.mutateAsync(values);
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Business details used on invoices and receipts." />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>These are separate from client data and appear on printed invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input id="businessName" {...register("businessName")} />
                {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input id="businessEmail" type="email" {...register("businessEmail")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input id="businessPhone" {...register("businessPhone")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="businessAddress">Business Address</Label>
                <Textarea id="businessAddress" rows={2} {...register("businessAddress")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gstNumber">GST Number (optional)</Label>
                <Input id="gstNumber" {...register("gstNumber")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Default Currency</Label>
                <Input id="currency" {...register("currency")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="defaultDueDay">Default Due Day</Label>
                <Input id="defaultDueDay" type="number" min={1} max={28} {...register("defaultDueDay")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
                <Textarea id="defaultPaymentTerms" rows={2} {...register("defaultPaymentTerms")} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
