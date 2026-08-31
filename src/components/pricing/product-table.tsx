import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Columns3,
  GitCompareArrows,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATEGORY_LABELS, REGION_LABELS, REGION_SHORT } from "@/lib/serverprice/data";
import { currency } from "@/lib/serverprice/discount";
import type { Category, Region, ServerProduct } from "@/lib/serverprice/types";
import { RackMark } from "@/components/rack-mark";
import { useDialogTrigger } from "@/hooks/use-dialog-trigger";
import { cn } from "@/lib/utils";
import { CompareDialog } from "./compare-dialog";

type SortKey = "name" | "category" | "region" | "basePrice" | "discount";

const AVAILABILITY_STYLE = {
  "in-stock": "border-success/25 bg-success/10 text-success",
  constrained: "border-warning/40 bg-warning/15 text-warning",
  backorder: "border-destructive/25 bg-destructive/10 text-destructive",
} as const;

export function ProductTable({
  products,
  isLoading,
}: {
  products: ServerProduct[];
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<Region | "all">("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "basePrice",
    dir: "desc",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const compareDialog = useDialogTrigger();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = products.filter(
      (p) =>
        (region === "all" || p.region === region) &&
        (category === "all" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sort.key) {
        case "basePrice":
          return (a.basePrice - b.basePrice) * dir;
        case "discount":
          return (bestTier(a) - bestTier(b)) * dir;
        case "region":
          return a.region.localeCompare(b.region) * dir;
        case "category":
          return a.category.localeCompare(b.category) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });
  }, [products, search, region, category, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  const toggleRow = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id],
    );

  const filtersActive = region !== "all" || category !== "all" || search.trim() !== "";
  const selectedProducts = products.filter((p) => selected.includes(p.id));
  const canCompare = selected.length >= 2;

  return (
    <section className="surface-card overflow-hidden">
      {/* Filter bar ------------------------------------------------ */}
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <label htmlFor="catalog-search" className="sr-only">
              Search products by name or SKU
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or SKU…"
              className="h-9 w-full pl-8 text-[0.8125rem] transition-shadow focus-visible:shadow-card sm:w-64"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <label htmlFor="filter-region" className="sr-only">
            Filter by region
          </label>
          <Select value={region} onValueChange={(v) => setRegion(v as Region | "all")}>
            <SelectTrigger
              id="filter-region"
              aria-label="Filter by region"
              className="h-9 w-[190px] text-[0.8125rem] transition-colors hover:border-border-strong"
            >
              <SlidersHorizontal className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[0.8125rem]">
                All regions
              </SelectItem>
              {Object.entries(REGION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-[0.8125rem]">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label htmlFor="filter-category" className="sr-only">
            Filter by category
          </label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category | "all")}>
            <SelectTrigger
              id="filter-category"
              aria-label="Filter by category"
              className="h-9 w-[185px] text-[0.8125rem] transition-colors hover:border-border-strong"
            >
              <Columns3 className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[0.8125rem]">
                All categories
              </SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-[0.8125rem]">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRegion("all");
                setCategory("all");
              }}
              className="focus-ring rounded-md px-2 py-1.5 text-[0.75rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="tabular text-[0.75rem] text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
            {products.length} SKUs
            {selected.length > 0 && (
              <span className="ml-1.5 text-accent">· {selected.length} selected</span>
            )}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant={canCompare ? "default" : "outline"}
                  disabled={!canCompare}
                  ref={compareDialog.triggerRef}
                  onClick={() => compareDialog.setOpen(true)}
                  aria-label={
                    canCompare
                      ? `Compare ${selected.length} selected SKUs side by side`
                      : "Compare — select 2 to 4 rows first"
                  }
                  className="h-9 gap-2 text-[0.8125rem] font-medium transition-all active:scale-[0.99] disabled:opacity-70"
                >
                  <GitCompareArrows className="size-3.5" aria-hidden="true" />
                  Compare
                  {selected.length > 0 && (
                    <span className="tabular rounded bg-primary-foreground/15 px-1.5 py-px text-[0.6875rem]">
                      {selected.length}
                    </span>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {canCompare
                ? `Compare ${selected.length} SKUs side by side`
                : "Select 2–4 rows to compare"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Table ----------------------------------------------------- */}
      <div className="scroll-slim overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse">
          <caption className="sr-only">
            Server SKU catalog — sortable by product, category, region, base price and discount
            tiers. Select rows to compare.
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface-muted/70">
              <th scope="col" className="w-10 px-5 py-2.5">
                <span className="sr-only">Select row</span>
              </th>

              <SortHeader
                label="Product"
                active={sort.key === "name"}
                dir={sort.dir}
                onClick={() => toggleSort("name")}
                className="min-w-[260px] text-left"
              />
              <SortHeader
                label="Category"
                active={sort.key === "category"}
                dir={sort.dir}
                onClick={() => toggleSort("category")}
                className="text-left"
              />
              <SortHeader
                label="Region"
                active={sort.key === "region"}
                dir={sort.dir}
                onClick={() => toggleSort("region")}
                className="text-left"
              />
              <SortHeader
                label="Base price / mo"
                active={sort.key === "basePrice"}
                dir={sort.dir}
                onClick={() => toggleSort("basePrice")}
                className="text-right"
              />
              <SortHeader
                label="Discount tiers"
                active={sort.key === "discount"}
                dir={sort.dir}
                onClick={() => toggleSort("discount")}
                className="text-left"
              />
              <th scope="col" className="px-5 py-2.5 text-right text-eyebrow">
                Availability
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    onReset={() => {
                      setSearch("");
                      setRegion("all");
                      setCategory("all");
                    }}
                    query={search}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((p, rowIndex) => {
                const isSelected = selected.includes(p.id);
                const atLimit = !isSelected && selected.length >= 4;
                return (
                  <tr
                    key={p.id}
                    onClick={() => !atLimit && toggleRow(p.id)}
                    style={{ animationDelay: `${Math.min(rowIndex * 25, 400)}ms` }}
                    className={cn(
                      "row-enter group cursor-pointer border-b border-border/70 transition-colors duration-150 last:border-0",
                      isSelected
                        ? "bg-accent-soft/50 hover:bg-accent-soft/70"
                        : "hover:bg-surface-muted",
                      atLimit && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        disabled={atLimit}
                        onCheckedChange={() => toggleRow(p.id)}
                        aria-label={`Select ${p.name}`}
                        className="transition-transform data-[state=checked]:scale-105"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-8 w-0.5 rounded-full transition-colors",
                            isSelected ? "bg-accent" : "bg-transparent",
                          )}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[0.875rem] font-semibold leading-5 tracking-[-0.006em] text-foreground">
                            {p.name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="font-mono text-[0.6875rem] text-muted-foreground">
                              {p.sku}
                            </span>
                            <span className="text-[0.6875rem] text-muted-foreground">
                              {p.vcpu ? `${p.vcpu} vCPU · ` : ""}
                              {p.memoryGb} GB · {p.networkGbps} Gbps
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[0.8125rem] text-muted-foreground">
                      {CATEGORY_LABELS[p.category]}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium text-foreground">
                        {REGION_SHORT[p.region]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="tabular text-[0.875rem] font-semibold text-foreground">
                        {currency(p.basePrice)}
                      </div>
                      <div
                        className={cn(
                          "tabular text-[0.6875rem] font-medium",
                          p.listPriceDelta > 0 ? "text-destructive/80" : "text-success",
                        )}
                      >
                        {p.listPriceDelta > 0 ? "+" : ""}
                        {p.listPriceDelta}% QoQ
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {p.discountTiers.length === 0 ? (
                        <span className="text-[0.75rem] text-muted-foreground">
                          No published tiers
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.discountTiers.map((t) => (
                            <Tooltip key={t.label}>
                              <TooltipTrigger asChild>
                                <span className="tabular cursor-default rounded border border-border bg-surface px-1.5 py-0.5 text-[0.6875rem] font-medium text-foreground transition-colors hover:border-accent/50 hover:bg-accent-soft">
                                  {t.percent}%
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {t.label} · {t.minUnits}+ units
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold capitalize",
                          AVAILABILITY_STYLE[p.availability],
                        )}
                      >
                        <span className="sr-only">Availability: </span>
                        {p.availability.replace("-", " ")}
                      </Badge>
                      <div className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                        {p.leadTimeDays}d lead<span className="sr-only"> time</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center justify-between border-t border-border bg-surface-muted/70 px-5 py-2.5">
          <span className="text-[0.75rem] text-muted-foreground">
            {selected.length} selected · maximum 4 SKUs per comparison
          </span>
          <button
            onClick={() => setSelected([])}
            className="focus-ring rounded px-2 py-1 text-[0.75rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      <CompareDialog
        products={selectedProducts}
        open={compareDialog.open && selectedProducts.length >= 2}
        onOpenChange={compareDialog.onOpenChange}
      />
    </section>
  );
}

function bestTier(p: ServerProduct) {
  return p.discountTiers.reduce((m, t) => Math.max(m, t.percent), 0);
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  const sortState = active ? (dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th scope="col" aria-sort={sortState} className={cn("px-5 py-2.5", className)}>
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label} — sorted ${sortState === "none" ? "not sorted" : sortState}. Activate to sort ${active && dir === "desc" ? "ascending" : "descending"}.`}
        className={cn(
          "focus-ring inline-flex items-center gap-1.5 text-eyebrow transition-colors hover:text-foreground",
          active && "text-foreground",
          className?.includes("text-right") && "flex-row-reverse",
        )}
      >
        <span aria-hidden="true">{label}</span>
        <Icon
          aria-hidden="true"
          className={cn("size-3", active ? "text-accent" : "text-muted-foreground")}
        />
      </button>
    </th>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border/70">
          <td className="px-5 py-3.5">
            <Skeleton className="size-4 rounded" />
          </td>
          <td className="px-5 py-3.5">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-1.5 h-3 w-36" />
          </td>
          <td className="px-5 py-3.5">
            <Skeleton className="h-3.5 w-28" />
          </td>
          <td className="px-5 py-3.5">
            <Skeleton className="h-4 w-16 rounded" />
          </td>
          <td className="px-5 py-3.5">
            <Skeleton className="ml-auto h-4 w-20" />
          </td>
          <td className="px-5 py-3.5">
            <div className="flex gap-1">
              <Skeleton className="h-4 w-9 rounded" />
              <Skeleton className="h-4 w-9 rounded" />
            </div>
          </td>
          <td className="px-5 py-3.5">
            <Skeleton className="ml-auto h-4 w-20 rounded-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyState({ onReset, query }: { onReset: () => void; query: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-muted">
        <RackMark />
      </div>
      <h3 className="mt-3 text-[0.9375rem] font-semibold text-foreground">
        No SKUs match these filters
      </h3>
      <p className="mt-1 max-w-sm text-[0.8125rem] leading-5 text-muted-foreground">
        {query
          ? `Nothing in the catalog matches “${query}” with the current region and category filters.`
          : "The current region and category combination has no published SKUs this quarter."}
      </p>
      <Button
        variant="outline"
        onClick={onReset}
        className="mt-4 h-8 bg-surface text-[0.8125rem] transition-colors hover:border-border-strong"
      >
        Reset all filters
      </Button>
    </div>
  );
}
