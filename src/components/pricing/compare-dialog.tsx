import { Check, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, REGION_SHORT } from "@/lib/serverprice/data";
import { currency } from "@/lib/serverprice/discount";
import type { ServerProduct } from "@/lib/serverprice/types";
import { cn } from "@/lib/utils";

type RowDef = {
  label: string;
  value: (p: ServerProduct) => string;
  /** higher is better | lower is better | neutral */
  rank?: (p: ServerProduct) => number;
  better?: "high" | "low";
  emphasis?: boolean;
};

const ROWS: RowDef[] = [
  { label: "SKU", value: (p) => p.sku },
  { label: "Category", value: (p) => CATEGORY_LABELS[p.category] },
  { label: "Region", value: (p) => REGION_SHORT[p.region] },
  {
    label: "Base price / mo",
    value: (p) => currency(p.basePrice),
    rank: (p) => p.basePrice,
    better: "low",
    emphasis: true,
  },
  {
    label: "Best discount",
    value: (p) => `${bestTier(p)}%`,
    rank: (p) => bestTier(p),
    better: "high",
    emphasis: true,
  },
  {
    label: "Effective floor price",
    value: (p) => currency(p.basePrice * (1 - bestTier(p) / 100)),
    rank: (p) => p.basePrice * (1 - bestTier(p) / 100),
    better: "low",
    emphasis: true,
  },
  { label: "vCPU", value: (p) => (p.vcpu ? `${p.vcpu}` : "—"), rank: (p) => p.vcpu, better: "high" },
  { label: "Memory", value: (p) => `${p.memoryGb} GB`, rank: (p) => p.memoryGb, better: "high" },
  {
    label: "Storage",
    value: (p) => (p.storageTb ? `${p.storageTb} TB` : "—"),
    rank: (p) => p.storageTb,
    better: "high",
  },
  {
    label: "Network",
    value: (p) => `${p.networkGbps} Gbps`,
    rank: (p) => p.networkGbps,
    better: "high",
  },
  {
    label: "Lead time",
    value: (p) => `${p.leadTimeDays} days`,
    rank: (p) => p.leadTimeDays,
    better: "low",
  },
  {
    label: "Margin floor",
    value: (p) => `${p.marginFloorPercent}%`,
    rank: (p) => p.marginFloorPercent,
    better: "low",
  },
  { label: "Availability", value: (p) => p.availability.replace("-", " ") },
];

function bestTier(p: ServerProduct) {
  return p.discountTiers.reduce((m, t) => Math.max(m, t.percent), 0);
}

export function CompareDialog({
  products,
  open,
  onOpenChange,
}: {
  products: ServerProduct[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1120px,94vw)] gap-0 overflow-hidden p-0 sm:max-w-[min(1120px,94vw)]">
        <DialogHeader className="space-y-0 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-page-title">Side-by-side comparison</DialogTitle>
          <DialogDescription className="mt-1 text-[0.8125rem]">
            {products.length} SKUs · best value in each row is highlighted, identical values are
            dimmed.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-auto">
          <table className="w-full border-collapse text-[0.8125rem]">
            <thead className="sticky top-0 z-10 bg-surface-muted">
              <tr>
                <th className="w-52 border-b border-border px-6 py-3 text-left text-eyebrow">
                  Attribute
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="min-w-[200px] border-b border-l border-border px-5 py-3 text-left align-top"
                  >
                    <div className="text-section-title text-foreground">{p.name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-[0.6875rem] text-muted-foreground">
                        {p.sku}
                      </span>
                      <Badge variant="secondary" className="h-5 rounded px-1.5 text-[0.625rem]">
                        {REGION_SHORT[p.region]}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const values = products.map(row.value);
                const allSame = values.every((v) => v === values[0]);
                const ranks = row.rank ? products.map(row.rank) : null;
                const best =
                  ranks && !allSame
                    ? row.better === "low"
                      ? Math.min(...ranks)
                      : Math.max(...ranks)
                    : null;

                return (
                  <tr key={row.label} className="transition-colors hover:bg-surface-muted/70">
                    <td
                      className={cn(
                        "border-b border-border px-6 py-3 align-middle text-[0.8125rem]",
                        row.emphasis ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {row.label}
                    </td>
                    {products.map((p, i) => {
                      const isBest = best !== null && ranks![i] === best;
                      return (
                        <td
                          key={p.id}
                          className={cn(
                            "border-b border-l border-border px-5 py-3 align-middle tabular",
                            allSame && "text-muted-foreground",
                            row.emphasis && "text-[0.875rem] font-semibold",
                            isBest && "bg-accent-soft/60",
                          )}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {isBest && (
                              <>
                                <Check className="size-3.5 text-accent" strokeWidth={2.6} aria-hidden="true" />
                                <span className="sr-only">Best value: </span>
                              </>
                            )}
                            {allSame && (
                              <>
                                <Minus className="size-3 text-muted-foreground/60" aria-hidden="true" />
                                <span className="sr-only">Identical across SKUs: </span>
                              </>
                            )}
                            {row.value(p)}
                          </span>

                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr>
                <td className="px-6 py-4 align-top text-[0.8125rem] text-muted-foreground">
                  Discount tiers
                </td>
                {products.map((p) => (
                  <td key={p.id} className="border-l border-border px-5 py-4 align-top">
                    {p.discountTiers.length === 0 ? (
                      <span className="text-meta">No published tiers</span>
                    ) : (
                      <ul className="space-y-1.5">
                        {p.discountTiers.map((t) => (
                          <li key={t.label} className="flex items-center justify-between gap-3">
                            <span className="text-[0.75rem] text-muted-foreground">{t.label}</span>
                            <span className="tabular text-[0.75rem] font-semibold text-foreground">
                              {t.percent}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
