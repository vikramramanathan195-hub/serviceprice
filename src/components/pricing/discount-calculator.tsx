import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Calculator,
  Check,
  ChevronRight,
  FileText,
  Info,
  Lock,
  Minus,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/serverprice/api";
import { CATEGORY_LABELS, REGION_SHORT, SEGMENT_LABELS } from "@/lib/serverprice/data";
import { currency } from "@/lib/serverprice/discount";
import type { CustomerSegment, DiscountQuote, ServerProduct } from "@/lib/serverprice/types";
import { RackLoader, RackMark } from "@/components/rack-mark";
import { useCountUp } from "@/hooks/use-count-up";
import { useDialogTrigger } from "@/hooks/use-dialog-trigger";
import { useViewRole } from "@/hooks/use-view-role";
import { cn } from "@/lib/utils";
import { ExportQuoteDialog } from "./export-quote-dialog";

const TERMS = [12, 24, 36] as const;

// Styling only. The explanation is never canned — it comes from the quote's
// own confidenceFactors, so it always describes what actually drove the score.
const CONFIDENCE_STYLES = {
  high: {
    dot: "bg-success",
    chip: "border-success/40 bg-success/10 text-success",
    label: "High confidence",
  },
  medium: {
    dot: "bg-warning",
    chip: "border-warning/50 bg-warning/15 text-warning",
    label: "Medium confidence",
  },
  low: {
    dot: "bg-destructive",
    chip: "border-destructive/40 bg-destructive/10 text-destructive",
    label: "Low confidence",
  },
} as const;

export function DiscountCalculator({ products }: { products: ServerProduct[] }) {
  const [productId, setProductId] = useState<string>("");
  const [segment, setSegment] = useState<CustomerSegment | "">("");
  const [term, setTerm] = useState<12 | 24 | 36>(24);
  const [units, setUnits] = useState("10");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [quote, setQuote] = useState<DiscountQuote | null>(null);
  const exportDialog = useDialogTrigger();
  const { role } = useViewRole();
  const readOnly = role === "manufacturing-rd";

  const product = products.find((p) => p.id === productId);

  const errors = useMemo(() => {
    const e: { product?: string; segment?: string; units?: string } = {};
    if (!productId) e.product = "Select a SKU — pricing rules are per-SKU, not per-family.";
    if (!segment) e.segment = "Customer segment sets the baseline discount. Required.";
    const n = Number(units);
    if (units.trim() === "") e.units = "Units is required — enter a whole number of units.";
    else if (!/^-?\d+$/.test(units.trim()) || Number.isNaN(n))
      e.units = "Units must be a whole number — partial nodes can't be quoted.";
    else if (n < 1) e.units = "Units must be at least 1.";
    else if (n > 5000) e.units = "Over 5,000 units requires a capacity review, not a quote.";
    return e;
  }, [productId, segment, units]);

  const isValid = Object.keys(errors).length === 0;

  const mutation = useMutation({
    mutationFn: api.quote,
    onSuccess: (data) => setQuote(data),
  });

  const submit = () => {
    setTouched({ product: true, segment: true, units: true });
    if (!isValid || !segment) return;
    mutation.mutate({
      productId,
      segment,
      units: Number(units),
      termMonths: term,
    });
  };

  const show = (k: "product" | "segment" | "units"): string | false =>
    (touched[k] && errors[k]) || false;

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="calc-heading">
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <Calculator className="size-4 text-accent" strokeWidth={2.2} aria-hidden="true" />
        <div>
          <h2 id="calc-heading" className="text-section-title text-foreground">
            Discount calculator
          </h2>
        </div>
        {readOnly && (
          <span className="status-pill ml-auto shrink-0 border-border-strong bg-secondary/60 text-muted-foreground">
            <Lock className="size-3" strokeWidth={2.5} />
            Read-only for Manufacturing/R&D
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 divide-y divide-border xl:grid-cols-[minmax(320px,380px)_1fr] xl:divide-x xl:divide-y-0">
        {/* Inputs -------------------------------------------------- */}
        <fieldset disabled={readOnly} className={cn("space-y-5 p-6", readOnly && "opacity-60")}>
          <Field label="Product SKU" error={show("product")} htmlFor="calc-product">
            <div className="flex items-center gap-2">
              <Select
                value={productId}
                onValueChange={(v) => {
                  setProductId(v);
                  setTouched((t) => ({ ...t, product: true }));
                  setQuote(null);
                }}
              >
                <SelectTrigger
                  id="calc-product"
                  aria-invalid={Boolean(show("product"))}
                  aria-describedby={show("product") ? "calc-product-error" : undefined}
                  className={cn(
                    "h-9 flex-1 text-[0.8125rem]",
                    show("product") && "border-destructive",
                  )}
                >
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-[0.8125rem]">
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 font-mono text-[0.6875rem] text-muted-foreground">
                        {p.sku}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {productId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Clear selected product"
                  onClick={() => {
                    setProductId("");
                    setQuote(null);
                    setTouched((t) => ({ ...t, product: false }));
                  }}
                  className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              )}
            </div>
            {product && (
              <p className="mt-1.5 text-meta">
                {CATEGORY_LABELS[product.category]} · {REGION_SHORT[product.region]} ·{" "}
                {currency(product.basePrice)}/mo list
              </p>
            )}
          </Field>

          <Field label="Customer segment" error={show("segment")} htmlFor="calc-segment">
            <Select
              value={segment}
              onValueChange={(v) => {
                setSegment(v as CustomerSegment);
                setTouched((t) => ({ ...t, segment: true }));
                setQuote(null);
              }}
            >
              <SelectTrigger
                id="calc-segment"
                aria-invalid={Boolean(show("segment"))}
                aria-describedby={show("segment") ? "calc-segment-error" : undefined}
                className={cn(
                  "h-9 w-full text-[0.8125rem]",
                  show("segment") && "border-destructive",
                )}
              >
                <SelectValue placeholder="Select a segment" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEGMENT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-[0.8125rem]">
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Units" error={show("units")} htmlFor="calc-units">
              <Input
                id="calc-units"
                inputMode="numeric"
                value={units}
                aria-invalid={Boolean(show("units"))}
                aria-describedby={show("units") ? "calc-units-error" : undefined}
                onBlur={() => setTouched((t) => ({ ...t, units: true }))}
                onChange={(e) => {
                  setUnits(e.target.value);
                  setTouched((t) => ({ ...t, units: true }));
                  setQuote(null);
                }}
                className={cn(
                  "h-9 tabular text-[0.8125rem]",
                  show("units") && "border-destructive focus-visible:ring-destructive/30",
                )}
              />
            </Field>

            <div role="group" aria-labelledby="calc-term-label">
              <span id="calc-term-label" className="text-[0.75rem] font-medium text-foreground">
                Term
              </span>
              <div className="mt-1.5 flex rounded-md border border-input bg-surface p-0.5">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={term === t}
                    aria-label={`${t} month contract term`}
                    onClick={() => {
                      setTerm(t);
                      setQuote(null);
                    }}
                    className={cn(
                      "focus-ring flex-1 rounded-[5px] py-1.5 text-[0.75rem] font-medium transition-all duration-150",
                      term === t
                        ? "bg-primary text-primary-foreground shadow-card"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {t}mo
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={mutation.isPending || !isValid || readOnly}
            aria-describedby="calc-submit-hint"
            className="h-9 w-full text-[0.8125rem] font-medium transition-all active:scale-[0.99]"
          >
            {mutation.isPending ? "Calculating…" : "Calculate discount"}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          <p id="calc-submit-hint" className="text-[0.75rem] text-muted-foreground">
            {readOnly
              ? "Manufacturing/R&D has read-only pricing access — switch roles to run a calculation."
              : isValid
                ? "All required fields are valid."
                : "Fix the highlighted fields above to enable calculation."}
          </p>
        </fieldset>

        {/* Result -------------------------------------------------- */}
        <div
          className="min-h-[380px] bg-surface-muted/60 p-6"
          aria-live="polite"
          aria-busy={mutation.isPending}
        >
          {mutation.isPending ? (
            <ResultSkeleton />
          ) : !quote || !product ? (
            <EmptyResult />
          ) : (
            <QuoteResult
              quote={quote}
              product={product}
              exportRef={exportDialog.triggerRef}
              onExport={() => exportDialog.setOpen(true)}
            />
          )}
        </div>
      </div>

      {quote && product && (
        <ExportQuoteDialog
          open={exportDialog.open}
          onOpenChange={exportDialog.onOpenChange}
          quote={quote}
          product={product}
        />
      )}
    </section>
  );
}

function QuoteResult({
  quote,
  product,
  onExport,
  exportRef,
}: {
  quote: DiscountQuote;
  product: ServerProduct;
  onExport: () => void;
  exportRef: React.Ref<HTMLButtonElement>;
}) {
  const conf = CONFIDENCE_STYLES[quote.confidence];

  return (
    <div className="space-y-5">
      {/* Hero: the discount % is the one number that should dominate here —
          oversized, tabular, with everything else clearly secondary. */}
      <div className="surface-hero flex flex-wrap items-start justify-between gap-x-8 gap-y-5 p-6">
        <div>
          <div className="text-eyebrow text-accent">Approved discount</div>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <AnimatedPercent value={quote.discountPercent} />
            <span className="text-[0.8125rem] text-muted-foreground">
              off list on <span className="font-mono text-foreground/80">{product.sku}</span>
            </span>
          </div>
          <p className="text-meta mt-2">
            {currency(product.basePrice)}/mo list → {currency(quote.netUnitPrice)}/mo net
          </p>
        </div>

        <div className="max-w-[290px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${conf.label}, score ${quote.confidenceScore} out of 100`}
                className={cn(
                  "focus-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] font-semibold transition-colors",
                  conf.chip,
                )}
              >
                <span className={cn("size-1.5 rounded-full", conf.dot)} aria-hidden="true" />
                {conf.label}
                <span className="tabular opacity-60">{quote.confidenceScore}</span>
                <Info className="size-3 opacity-70" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[280px] text-left">
              <p className="font-semibold">Confidence score: {quote.confidenceScore}/100</p>
              <p className="mt-1 leading-relaxed opacity-90">
                Weighs comparable closed-won deals for this segment, whether a published commit tier
                applies, supply certainty, and headroom above the margin floor.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Real signals from this specific quote — never a canned caption. */}
          <ul className="mt-2 space-y-1">
            {quote.confidenceFactors.map((f) => (
              <li key={f.label} className="flex items-start gap-1.5 text-[0.75rem] leading-4">
                {f.direction === "up" ? (
                  <Check
                    className="mt-0.5 size-3 shrink-0 text-success"
                    strokeWidth={2.75}
                    aria-hidden="true"
                  />
                ) : (
                  <Minus
                    className="mt-0.5 size-3 shrink-0 text-muted-foreground/70"
                    strokeWidth={2.75}
                    aria-hidden="true"
                  />
                )}
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground/90">{f.label}</span> — {f.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Net unit / mo" value={currency(quote.netUnitPrice)} />
        <Metric label={`${quote.termMonths}mo contract`} value={currency(quote.netTotal)} strong />
        <Metric label="Customer savings" value={currency(quote.savings)} tone="accent" />
        <Metric
          label="Margin remaining"
          value={`${quote.marginPercent}%`}
          tone={quote.marginPercent < 6 ? "warn" : "default"}
        />
      </div>

      {/* Ledger: reads like a receipt — each rule a line, deltas right-aligned
          in tabular figures, ending in a ruled total that ties to the hero. */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[0.8125rem] font-semibold text-foreground">Why this number</h3>
          <span className="text-meta">
            {quote.units.toLocaleString("en-US")} units · {quote.termMonths}mo ·{" "}
            {REGION_SHORT[product.region]} · {SEGMENT_LABELS[quote.segment]}
          </span>
        </div>

        <ul className="mt-3 border-t border-border/70">
          {quote.rules.map((r) => (
            <li
              key={r.label}
              className="flex items-start justify-between gap-4 border-b border-border/50 py-2.5 transition-colors hover:bg-surface-muted/70"
            >
              <div className="min-w-0">
                <div className="text-[0.8125rem] font-medium text-foreground">{r.label}</div>
                <div className="text-meta">{r.detail}</div>
              </div>
              <span
                className={cn(
                  "tabular shrink-0 text-[0.8125rem] font-semibold",
                  r.delta > 0
                    ? "text-success"
                    : r.delta < 0
                      ? "text-destructive"
                      : "text-muted-foreground/70",
                )}
              >
                {r.delta > 0 ? "+" : ""}
                {r.delta.toFixed(1)}%
              </span>
            </li>
          ))}
          <li className="flex items-baseline justify-between gap-4 pt-3">
            <span className="text-[0.8125rem] font-semibold text-foreground">Total discount</span>
            <span className="tabular text-[1rem] font-bold text-accent">
              {quote.discountPercent.toFixed(1)}%
            </span>
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[0.75rem]">
          {quote.requiresApproval ? (
            <>
              <AlertCircle className="size-3.5 text-warning" aria-hidden="true" />
              <span className="text-muted-foreground">
                Above the 20% desk threshold — VP Sales approval required before sending.
              </span>
            </>
          ) : (
            <>
              <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
              <span className="text-muted-foreground">
                Within rep authority — no additional approval needed.
              </span>
            </>
          )}
        </div>
        <Button
          variant="outline"
          ref={exportRef}
          onClick={onExport}
          className="h-9 gap-2 bg-surface text-[0.8125rem] font-medium transition-all hover:border-border-strong active:scale-[0.99]"
        >
          <FileText className="size-3.5" aria-hidden="true" />
          Finalize &amp; export quote
        </Button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  strong,
  tone = "default",
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "default" | "accent" | "warn";
}) {
  return (
    <div className="hover-lift rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "tabular mt-1 font-semibold text-foreground",
          strong ? "text-[1.0625rem]" : "text-[0.9375rem]",
          tone === "accent" && "text-accent",
          tone === "warn" && "text-warning",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string | false;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-[0.75rem] font-medium text-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-[0.75rem] font-medium text-destructive"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="flex h-full min-h-[332px] flex-col items-center justify-center text-center">
      <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface">
        <RackMark />
      </div>
      <h3 className="mt-3 text-[0.875rem] font-semibold text-foreground">No calculation yet</h3>
      <p className="mt-1 max-w-xs text-[0.8125rem] leading-5 text-muted-foreground">
        Pick a SKU, segment, unit count and term. You'll get the discount plus the exact rules that
        produced it — nothing is inferred.
      </p>
      <div className="mt-4 flex items-center gap-1.5 text-[0.75rem] text-muted-foreground">
        <Check className="size-3.5 text-accent" />
        Rules last synced 09:14 today
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex h-full min-h-[332px] items-center justify-center">
      <RackLoader label="Running pricing rules…" />
    </div>
  );
}

function AnimatedPercent({ value }: { value: number }) {
  const animated = useCountUp(value, 500);
  return (
    <span className="tabular text-[3rem] font-bold leading-[0.95] tracking-[-0.035em] text-foreground">
      {animated.toFixed(1)}%
    </span>
  );
}
