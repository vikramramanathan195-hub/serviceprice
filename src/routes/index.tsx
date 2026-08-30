import { createFileRoute } from "@tanstack/react-router";
import { useDialogTrigger } from "@/hooks/use-dialog-trigger";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Download, Layers, Percent, TrendingUp } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DiscountCalculator } from "@/components/pricing/discount-calculator";
import { ExportCatalogDialog } from "@/components/pricing/export-catalog-dialog";
import { ProductTable } from "@/components/pricing/product-table";
import { currency } from "@/lib/serverprice/discount";
import { productsQueryOptions } from "@/lib/serverprice/queries";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pricing Dashboard — ServerPrice" },
      {
        name: "description",
        content:
          "Internal server hardware pricing catalog: compare SKUs across regions and calculate segment-based discounts.",
      },
      { property: "og:title", content: "Pricing Dashboard — ServerPrice" },
      {
        property: "og:description",
        content: "Internal catalog for server hardware pricing and discount approvals.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(productsQueryOptions());
  },
  component: PricingDashboard,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-destructive">
      Catalog unavailable: {error.message}
    </div>
  ),
});

function PricingDashboard() {
  const { data: products = [], isLoading } = useQuery(productsQueryOptions());
  const exportDialog = useDialogTrigger();


  const avgDiscount = products.length
    ? products.reduce((s, p) => s + p.discountTiers.reduce((m, t) => Math.max(m, t.percent), 0), 0) /
      products.length
    : 0;
  const constrained = products.filter((p) => p.availability !== "in-stock").length;
  const medianPrice = (() => {
    if (!products.length) return 0;
    const sorted = [...products].map((p) => p.basePrice).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
  })();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Sales · Pricing desk"
        title="Pricing Dashboard"
        description="Q3 FY26 rate card. Compare SKUs across regions and model segment discounts before they reach a customer."
        meta={
          <span className="hidden text-[0.75rem] text-muted-foreground sm:inline">
            Rate card synced 09:14
          </span>
        }
        actions={
          <Button
            variant="outline"
            ref={exportDialog.triggerRef}
            onClick={() => exportDialog.setOpen(true)}
            className="h-9 gap-2 bg-surface text-[0.8125rem] font-medium shadow-card transition-all hover:border-border-strong active:scale-[0.99]"
          >
            <Download className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Export catalog
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 px-6 py-6 lg:px-8">
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Catalog summary">
          <SummaryStat
            icon={Layers}
            label="Active SKUs"
            value={String(products.length)}
            hint="Published on the Q3 rate card"
            loading={isLoading}
          />
          <SummaryStat
            icon={CircleDollarSign}
            label="Median list price"
            value={currency(medianPrice)}
            hint="Per unit, per month"
            loading={isLoading}
          />
          <SummaryStat
            icon={Percent}
            label="Avg. max discount"
            value={`${avgDiscount.toFixed(1)}%`}
            hint="Best published tier per SKU"
            accent
            loading={isLoading}
          />
          <SummaryStat
            icon={TrendingUp}
            label="Supply-constrained"
            value={`${constrained} SKUs`}
            hint="Concessions restricted by the pricing desk"
            loading={isLoading}
          />
        </section>

        <ProductTable products={products} isLoading={isLoading} />

        <DiscountCalculator products={products} />
      </main>

      <ExportCatalogDialog
        open={exportDialog.open}
        onOpenChange={exportDialog.onOpenChange}
        products={products}
      />
    </AppShell>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  loading,
}: {
  icon: typeof Layers;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="surface-card group flex items-start gap-3.5 p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-raised">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors",
          accent
            ? "border-accent/25 bg-accent-soft text-accent"
            : "border-border bg-surface-muted text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="text-eyebrow">{label}</div>
        {loading ? (
          <Skeleton className="mt-1 h-5 w-20" />
        ) : (
          <div className="tabular mt-1 text-[1.25rem] font-semibold leading-none tracking-tight text-foreground">
            {value}
          </div>
        )}
        <div className="mt-1.5 text-[0.75rem] leading-4 text-muted-foreground">{hint}</div>
      </div>
    </div>
  );

}
