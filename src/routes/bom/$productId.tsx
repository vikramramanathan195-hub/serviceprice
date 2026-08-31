import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Lock, ShieldOff } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RackLoader } from "@/components/rack-mark";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/use-count-up";
import { useViewRole } from "@/hooks/use-view-role";
import { currency } from "@/lib/serverprice/discount";
import { STAKEHOLDER_ROLE_LABELS } from "@/lib/serverprice/data";
import { productBomQueryOptions, productsQueryOptions } from "@/lib/serverprice/queries";
import type { BomComponent, ProductBom } from "@/lib/serverprice/types";
import { cn } from "@/lib/utils";

// The external partner supplies the chassis/PSU assembly on every product —
// same company that signs off on deals. This is the only row that role sees.
const EXTERNAL_PARTNER_SUPPLIER = "Solace Manufacturing";
const EXEC_APPROVAL_THRESHOLD = 20;

export const Route = createFileRoute("/bom/$productId")({
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.productName} BOM — Deal Desk` : "Manufacturing BOM" },
    ],
  }),
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(productBomQueryOptions(params.productId));
  },
  component: BomDetailPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-destructive">
      Manufacturing BOM unavailable: {error.message}
    </div>
  ),
});

function BomDetailPage() {
  const { productId } = Route.useParams();
  const { data: bom, isLoading } = useQuery(productBomQueryOptions(productId));
  const { data: products = [] } = useQuery(productsQueryOptions());
  const { role } = useViewRole();

  const product = products.find((p) => p.id === productId);
  const bestDiscountPercent = product
    ? product.discountTiers.reduce((max, t) => Math.max(max, t.percent), 0)
    : 0;

  return (
    <AppShell>
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-1.5 px-6 py-5 lg:px-8">
          <Link
            to="/catalog"
            className="focus-ring inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Pricing catalog
          </Link>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="text-page-title text-foreground">
              {bom ? bom.productName : "Manufacturing BOM"}
            </h1>
            {bom && (
              <span className="font-mono text-[0.75rem] text-muted-foreground">{bom.sku}</span>
            )}
          </div>
          <p className="text-meta">
            Manufacturing components and cost — distinct from the customer-facing Bill of Materials
            on a deal. Viewing as {STAKEHOLDER_ROLE_LABELS[role]}.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-8 lg:px-8">
        {isLoading || !bom ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <RackLoader label="Loading manufacturing BOM…" />
          </div>
        ) : role === "external-partner" ? (
          <ExternalPartnerView bom={bom} />
        ) : role === "senior-leadership" ? (
          <SeniorLeadershipView bom={bom} bestDiscountPercent={bestDiscountPercent} />
        ) : role === "country-head-sales" ? (
          <CountryHeadView bom={bom} />
        ) : (
          <ManufacturingView bom={bom} />
        )}
      </main>
    </AppShell>
  );
}

function ManufacturingView({ bom }: { bom: ProductBom }) {
  return (
    <div className="space-y-6">
      <BomHero bom={bom} />
      <ComponentTable components={bom.components} showCosts />
    </div>
  );
}

function CountryHeadView({ bom }: { bom: ProductBom }) {
  return (
    <div className="space-y-6">
      <div className="surface-card flex items-start gap-3 p-4">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        <p className="text-[0.8125rem] leading-5 text-muted-foreground">
          Component cost and margin are restricted for Country Head/Sales — pricing here reflects
          negotiated deal terms, not internal manufacturing economics. You can see what's inside
          this SKU and how long each part takes to source.
        </p>
      </div>
      <ComponentTable components={bom.components} showCosts={false} />
    </div>
  );
}

function SeniorLeadershipView({
  bom,
  bestDiscountPercent,
}: {
  bom: ProductBom;
  bestDiscountPercent: number;
}) {
  const [approved, setApproved] = useState(false);
  const needsApproval = bestDiscountPercent > EXEC_APPROVAL_THRESHOLD;
  const animatedMargin = useCountUp(bom.marginPercent, 500);

  return (
    <div className="space-y-6">
      <div className="surface-hero p-6">
        <div className="text-eyebrow text-accent">Aggregate margin summary</div>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <div className="text-eyebrow">Base price</div>
            <div className="tabular mt-1 text-[1.5rem] font-bold text-foreground">
              {currency(bom.basePrice)}
            </div>
          </div>
          <div>
            <div className="text-eyebrow">Total BOM cost</div>
            <div className="tabular mt-1 text-[1.5rem] font-bold text-foreground">
              {currency(bom.totalBomCost)}
            </div>
          </div>
          <div>
            <div className="text-eyebrow">Margin</div>
            <div className="tabular mt-1 flex items-baseline gap-2 text-[1.5rem] font-bold text-accent">
              {animatedMargin.toFixed(1)}%
              <span className="text-[0.8125rem] font-medium text-muted-foreground">
                {currency(bom.marginUsd)}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-meta">
          {bom.components.length} components rolled up — per-component detail is a Manufacturing/R&D
          view, not shown here.
        </p>
      </div>

      {needsApproval && (
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-2.5">
            <ShieldOff className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={2} />
            <p className="text-[0.8125rem] leading-5 text-muted-foreground">
              This SKU publishes a commit tier above 20% ({bestDiscountPercent}%) — the same
              threshold that routes deals to Senior Leadership sign-off. Review the margin position
              before that tier goes into a quote.
            </p>
          </div>
          {approved ? (
            <span className="status-pill shrink-0 border-success/30 bg-success/10 text-success">
              <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
              Approved
            </span>
          ) : (
            <Button
              size="sm"
              className="h-8 shrink-0 gap-1.5 text-[0.75rem]"
              onClick={() => setApproved(true)}
            >
              Approve
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ExternalPartnerView({ bom }: { bom: ProductBom }) {
  const mine = bom.components.filter((c) => c.supplier === EXTERNAL_PARTNER_SUPPLIER);

  if (mine.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <ShieldOff className="size-8 text-muted-foreground" strokeWidth={1.6} />
        <p className="max-w-sm text-[0.8125rem] leading-5 text-muted-foreground">
          Solace Manufacturing doesn't supply a component on this SKU — nothing to show for your
          account here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface-card flex items-start gap-3 p-4">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        <p className="text-[0.8125rem] leading-5 text-muted-foreground">
          External Partner accounts see only the component(s) they supply — not the rest of this
          BOM, its total cost, or margin.
        </p>
      </div>
      {mine.map((c) => (
        <div key={c.id} className="surface-hero p-6">
          <div className="text-eyebrow text-accent">{c.category}</div>
          <h2 className="mt-1 text-[1.125rem] font-bold text-foreground">{c.name}</h2>
          <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <div className="text-eyebrow">Unit cost</div>
              <div className="tabular mt-1 text-[1.25rem] font-bold text-foreground">
                {currency(c.unitCost)}
              </div>
            </div>
            <div>
              <div className="text-eyebrow">Quantity</div>
              <div className="tabular mt-1 text-[1.25rem] font-bold text-foreground">
                {c.quantity}
              </div>
            </div>
            <div>
              <div className="text-eyebrow">Lead time</div>
              <div className="tabular mt-1 text-[1.25rem] font-bold text-foreground">
                {c.leadTimeDays}d
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BomHero({ bom }: { bom: ProductBom }) {
  const animatedCost = useCountUp(bom.totalBomCost);
  return (
    <div className="surface-hero p-6">
      <div className="text-eyebrow text-accent">Total BOM cost</div>
      <div className="tabular mt-1.5 text-display text-foreground">{currency(animatedCost)}</div>
      <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div>
          <div className="text-eyebrow">Base price</div>
          <div className="tabular mt-1 text-[1.0625rem] font-bold text-foreground">
            {currency(bom.basePrice)}
          </div>
        </div>
        <div>
          <div className="text-eyebrow">Margin</div>
          <div className="tabular mt-1 text-[1.0625rem] font-bold text-accent">
            {currency(bom.marginUsd)}{" "}
            <span className="text-[0.8125rem] font-medium text-muted-foreground">
              ({bom.marginPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
        <div>
          <div className="text-eyebrow">Components</div>
          <div className="tabular mt-1 text-[1.0625rem] font-bold text-foreground">
            {bom.components.length}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentTable({
  components,
  showCosts,
}: {
  components: BomComponent[];
  showCosts: boolean;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="scroll-slim overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[0.8125rem]">
          <thead>
            <tr className="border-b border-border bg-surface-muted/70 text-left">
              <th className="px-5 py-2.5 font-medium text-muted-foreground">Component</th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground">Category</th>
              <th className="px-3 py-2.5 font-medium text-muted-foreground">Supplier</th>
              {showCosts && (
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Unit cost
                </th>
              )}
              {showCosts && (
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
              )}
              <th className="px-5 py-2.5 text-right font-medium text-muted-foreground">
                Lead time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {components.map((c, rowIndex) => (
              <tr
                key={c.id}
                style={{ animationDelay: `${rowIndex * 30}ms` }}
                className="row-enter transition-colors hover:bg-surface-muted"
              >
                <td className="px-5 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-3 py-3 text-muted-foreground">{c.category}</td>
                <td className="px-3 py-3 text-muted-foreground">{c.supplier}</td>
                {showCosts && (
                  <td className="tabular px-3 py-3 text-right text-foreground">
                    {currency(c.unitCost)}
                  </td>
                )}
                {showCosts && (
                  <td className="tabular px-3 py-3 text-right text-foreground">{c.quantity}</td>
                )}
                <td className="tabular px-5 py-3 text-right text-muted-foreground">
                  {c.leadTimeDays}d
                </td>
              </tr>
            ))}
          </tbody>
          {showCosts && (
            <tfoot>
              <tr className="border-t border-border-strong bg-surface-muted">
                <td
                  className={cn(
                    "px-5 py-3 text-right text-[0.75rem] font-medium text-muted-foreground",
                  )}
                  colSpan={3}
                >
                  Total cost
                </td>
                <td
                  className="tabular px-3 py-3 text-right text-[0.9375rem] font-bold text-accent"
                  colSpan={2}
                >
                  {currency(components.reduce((s, c) => s + c.unitCost * c.quantity, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
