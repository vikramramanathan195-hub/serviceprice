import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  Gauge,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
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
import {
  marginCustomersQueryOptions,
  marginMetaQueryOptions,
  marginPortfoliosQueryOptions,
} from "@/lib/serverprice/queries";
import { REGION_SHORT } from "@/lib/serverprice/data";
import { currency } from "@/lib/serverprice/discount";
import type {
  Channel,
  DealMarginCalcResponse,
  DealMotion,
  MarginLineInput,
  MarginLineResult,
  RiskRating,
} from "@/lib/serverprice/types";
import { cn } from "@/lib/utils";

const CHANNEL_LABELS: Record<Channel, string> = { direct: "Direct", indirect: "Indirect" };

const RATING_STYLES: Record<RiskRating, { dot: string; chip: string }> = {
  Good: { dot: "bg-success", chip: "border-success/40 bg-success/10 text-success" },
  Fair: { dot: "bg-accent", chip: "border-accent/40 bg-accent-soft text-accent" },
  Weak: { dot: "bg-warning", chip: "border-warning/50 bg-warning/15 text-warning" },
  Poor: { dot: "bg-destructive", chip: "border-destructive/40 bg-destructive/10 text-destructive" },
};

const CONFIDENCE_STYLES = {
  high: { dot: "bg-success", chip: "border-success/40 bg-success/10 text-success", label: "High confidence" },
  medium: { dot: "bg-warning", chip: "border-warning/50 bg-warning/15 text-warning", label: "Medium confidence" },
  low: { dot: "bg-destructive", chip: "border-destructive/40 bg-destructive/10 text-destructive", label: "Low confidence" },
} as const;

// Green-through-red hue sweep for the 5-tier band bar — a raw hue scale
// rather than theme tokens, so it reads consistently in light and dark.
function tierColor(index: number, total: number): string {
  const hue = 142 - (142 / (total - 1)) * index; // 142 = green, ~0 = red
  return `oklch(0.62 0.13 ${hue.toFixed(0)})`;
}

let lineSeq = 0;
function nextLineId() {
  lineSeq += 1;
  return `line-${lineSeq}`;
}

interface LineDraft extends MarginLineInput {
  id: string;
}

function emptyLine(): LineDraft {
  return {
    id: nextLineId(),
    portfolioId: "",
    channel: "direct",
    grossOrderValueUsd: 0,
    requestedDiscountPercent: 0,
  };
}

export function MarginValidator() {
  const { data: portfolios = [] } = useQuery(marginPortfoliosQueryOptions());
  const { data: customers = [] } = useQuery(marginCustomersQueryOptions());
  const { data: meta } = useQuery(marginMetaQueryOptions());

  const [customerId, setCustomerId] = useState("");
  const [region, setRegion] = useState<string>("");
  const [dealMotion, setDealMotion] = useState<DealMotion[]>([]);
  const [fiscalPeriod, setFiscalPeriod] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [result, setResult] = useState<DealMarginCalcResponse | null>(null);

  const customer = customers.find((c) => c.id === customerId);

  const isValid =
    Boolean(customerId) &&
    Boolean(region) &&
    dealMotion.length > 0 &&
    Boolean(fiscalPeriod) &&
    lines.length > 0 &&
    lines.every((l) => l.portfolioId && l.grossOrderValueUsd > 0);

  const mutation = useMutation({
    mutationFn: api.calculateDealMargin,
    onSuccess: (data) => setResult(data),
  });

  const submit = () => {
    if (!isValid) return;
    mutation.mutate({
      customerId,
      region: region as never,
      dealMotion,
      fiscalPeriod,
      lines: lines.map(({ id: _id, ...rest }) => rest),
    });
  };

  const updateLine = (id: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    setResult(null);
  };

  const toggleMotion = (m: DealMotion) => {
    setDealMotion((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
    setResult(null);
  };

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="margin-heading">
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <Gauge className="size-4 text-accent" strokeWidth={2.2} aria-hidden="true" />
        <div>
          <h2 id="margin-heading" className="text-section-title text-foreground">
            Deal margin validator
          </h2>
          <p className="text-meta">
            Grades requested discount per portfolio line against a margin-erosion band, grouped by
            channel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border xl:grid-cols-[minmax(360px,420px)_1fr] xl:divide-x xl:divide-y-0">
        {/* Inputs -------------------------------------------------- */}
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer ID" htmlFor="mv-customer">
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v);
                  const c = customers.find((x) => x.id === v);
                  if (c) setRegion(c.region);
                  setResult(null);
                }}
              >
                <SelectTrigger id="mv-customer" className="h-9 text-[0.8125rem]">
                  <SelectValue placeholder="Select ID" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-mono text-[0.75rem]">
                      {c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Region" htmlFor="mv-region">
              <Select
                value={region}
                onValueChange={(v) => {
                  setRegion(v);
                  setResult(null);
                }}
              >
                <SelectTrigger id="mv-region" className="h-9 text-[0.8125rem]">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGION_SHORT).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-[0.8125rem]">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {customer && (
            <p className="-mt-2 text-meta">
              Customer name: <span className="font-medium text-foreground/90">{customer.name}</span>
            </p>
          )}

          <Field label="Fiscal period" htmlFor="mv-fiscal">
            <Select
              value={fiscalPeriod}
              onValueChange={(v) => {
                setFiscalPeriod(v);
                setResult(null);
              }}
            >
              <SelectTrigger id="mv-fiscal" className="h-9 text-[0.8125rem]">
                <SelectValue placeholder="Select fiscal period" />
              </SelectTrigger>
              <SelectContent>
                {(meta?.fiscalPeriods ?? []).map((p) => (
                  <SelectItem key={p} value={p} className="text-[0.8125rem]">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div role="group" aria-labelledby="mv-motion-label">
            <span id="mv-motion-label" className="text-[0.75rem] font-medium text-foreground">
              Deal motion
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {Object.entries(meta?.dealMotions ?? {}).map(([k, label]) => {
                const active = dealMotion.includes(k as DealMotion);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMotion(k as DealMotion)}
                    className={cn(
                      "focus-ring rounded-full border px-2.5 py-1 text-[0.75rem] font-medium transition-colors",
                      active
                        ? "border-accent/40 bg-accent-soft text-accent"
                        : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] font-medium text-foreground">Portfolio lines</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="h-7 gap-1 text-[0.75rem] text-accent hover:text-accent"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add line
              </Button>
            </div>

            {lines.map((line, i) => (
              <div key={line.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Line {i + 1}
                  </span>
                  {lines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove line ${i + 1}`}
                      onClick={() => {
                        setLines((prev) => prev.filter((l) => l.id !== line.id));
                        setResult(null);
                      }}
                      className="size-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Select
                    value={line.portfolioId}
                    onValueChange={(v) => updateLine(line.id, { portfolioId: v })}
                  >
                    <SelectTrigger className="h-8 text-[0.75rem]">
                      <SelectValue placeholder="Portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-[0.75rem]">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={line.channel}
                    onValueChange={(v) => updateLine(line.id, { channel: v as Channel })}
                  >
                    <SelectTrigger className="h-8 text-[0.75rem]">
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-[0.75rem]">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div>
                    <Label className="text-[0.6875rem] text-muted-foreground">
                      Gross order value (USD)
                    </Label>
                    <Input
                      inputMode="decimal"
                      value={line.grossOrderValueUsd || ""}
                      onChange={(e) =>
                        updateLine(line.id, { grossOrderValueUsd: Number(e.target.value) || 0 })
                      }
                      className="mt-1 h-8 tabular text-[0.75rem]"
                    />
                  </div>

                  <div>
                    <Label className="text-[0.6875rem] text-muted-foreground">
                      Requested discount %
                    </Label>
                    <Input
                      inputMode="decimal"
                      value={line.requestedDiscountPercent || ""}
                      onChange={(e) =>
                        updateLine(line.id, {
                          requestedDiscountPercent: Number(e.target.value) || 0,
                        })
                      }
                      className="mt-1 h-8 tabular text-[0.75rem]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={submit}
            disabled={mutation.isPending || !isValid}
            className="h-9 w-full text-[0.8125rem] font-medium transition-all active:scale-[0.99]"
          >
            {mutation.isPending ? "Validating…" : "Validate deal"}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          {mutation.isError && (
            <p role="alert" className="text-[0.75rem] font-medium text-destructive">
              {(mutation.error as Error).message}
            </p>
          )}
        </div>

        {/* Result -------------------------------------------------- */}
        <div className="min-h-[380px] bg-surface-muted/60 p-6" aria-live="polite">
          {!result ? (
            <EmptyResult />
          ) : (
            <MarginResult result={result} />
          )}
        </div>
      </div>
    </section>
  );
}

function MarginResult({ result }: { result: DealMarginCalcResponse }) {
  const conf = CONFIDENCE_STYLES[result.confidence.level];
  const multiChannel = result.channelGroups.length > 1;

  return (
    <div className="space-y-5">
      <div className="surface-hero flex flex-wrap items-start justify-between gap-x-8 gap-y-5 p-6">
        <div>
          <div className="text-eyebrow text-accent">Overall deal rating</div>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <RatingBadge rating={result.grandTotal.rating} large />
          </div>
          <p className="text-meta mt-2">
            {currency(result.grandTotal.grossOrderValueUsd)} gross →{" "}
            {currency(result.grandTotal.netOrderValueUsd)} net (
            {result.grandTotal.blendedDiscountPercent.toFixed(1)}% blended discount)
          </p>
        </div>

        <div className="max-w-[290px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${conf.label}, score ${result.confidence.score} out of 100`}
                className={cn(
                  "focus-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] font-semibold transition-colors",
                  conf.chip,
                )}
              >
                <span className={cn("size-1.5 rounded-full", conf.dot)} aria-hidden="true" />
                {conf.label}
                <span className="tabular opacity-60">{result.confidence.score}</span>
                <Info className="size-3 opacity-70" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[280px] text-left">
              <p className="font-semibold">Confidence score: {result.confidence.score}/100</p>
              <p className="mt-1 leading-relaxed opacity-90">
                The rating above answers "is this discount acceptable." This score answers "why" —
                weighing band fit, customer discount history, and channel spread.
              </p>
            </TooltipContent>
          </Tooltip>

          <ul className="mt-2 space-y-1">
            {result.confidence.factors.map((f) => (
              <li key={f.label} className="flex items-start gap-1.5 text-[0.75rem] leading-4">
                {f.direction === "up" ? (
                  <Check className="mt-0.5 size-3 shrink-0 text-success" strokeWidth={2.75} aria-hidden="true" />
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

      {result.channelGroups.map((group) => (
        <div key={group.channel} className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[0.8125rem] font-semibold text-foreground">
              {multiChannel ? `${CHANNEL_LABELS[group.channel]} channel` : "Deal lines"}
            </h3>
            <RatingBadge rating={group.total.rating} />
          </div>

          <ul className="mt-3 divide-y divide-border/50">
            {group.lines.map((line) => (
              <LineRow key={`${line.portfolioId}-${line.channel}`} line={line} />
            ))}
          </ul>

          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-[0.8125rem] font-semibold text-foreground">
              {multiChannel ? `${CHANNEL_LABELS[group.channel]} total` : "Total"}
            </span>
            <span className="tabular text-[0.9375rem] font-bold text-foreground">
              {currency(group.total.netOrderValueUsd)}{" "}
              <span className="text-[0.75rem] font-medium text-muted-foreground">
                ({group.total.blendedDiscountPercent.toFixed(1)}%)
              </span>
            </span>
          </div>
        </div>
      ))}

      {multiChannel && (
        <div className="flex items-baseline justify-between rounded-lg border border-border-strong bg-surface-muted px-4 py-3">
          <span className="text-[0.8125rem] font-semibold text-foreground">Deal total (all channels)</span>
          <div className="flex items-center gap-3">
            <span className="tabular text-[0.9375rem] font-bold text-foreground">
              {currency(result.grandTotal.netOrderValueUsd)}
            </span>
            <RatingBadge rating={result.grandTotal.rating} />
          </div>
        </div>
      )}
    </div>
  );
}

function LineRow({ line }: { line: MarginLineResult }) {
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[0.8125rem] font-medium text-foreground">{line.portfolioName}</div>
          <div className="text-meta">
            {currency(line.grossOrderValueUsd)} gross · {line.requestedDiscountPercent.toFixed(1)}%
            requested → {currency(line.netOrderValueUsd)} net
            {line.historicalDiscountPercent !== null && (
              <> · history {line.historicalDiscountPercent.toFixed(1)}%</>
            )}
          </div>
        </div>
        <RatingBadge rating={line.rating} />
      </div>

      <BandBar band={line.band} requested={line.requestedDiscountPercent} />
    </li>
  );
}

function BandBar({
  band,
  requested,
}: {
  band: MarginLineResult["band"];
  requested: number;
}) {
  const max = band.at(-1)?.maxDiscountPercent ?? 1;
  const markerPct = Math.min(100, (requested / max) * 100);

  return (
    <div className="mt-2.5">
      <div className="relative flex h-2 overflow-hidden rounded-full">
        {band.map((tier, i) => {
          const prevMax = i === 0 ? 0 : (band[i - 1]?.maxDiscountPercent ?? 0);
          const width = ((tier.maxDiscountPercent - prevMax) / max) * 100;
          return (
            <div
              key={tier.tier}
              style={{ width: `${width}%`, backgroundColor: tierColor(i, band.length) }}
              title={`${tier.tier} — up to ${tier.maxDiscountPercent}%`}
            />
          );
        })}
        <div
          className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 bg-foreground"
          style={{ left: `${markerPct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1 flex justify-between text-[0.6875rem] text-muted-foreground">
        {band.map((tier) => (
          <span key={tier.tier}>{tier.tier}</span>
        ))}
      </div>
    </div>
  );
}

function RatingBadge({ rating, large }: { rating: RiskRating; large?: boolean }) {
  const style = RATING_STYLES[rating];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold",
        style.chip,
        large ? "px-3 py-1.5 text-[1rem]" : "px-2.5 py-1 text-[0.75rem]",
      )}
    >
      <span className={cn("rounded-full", style.dot, large ? "size-2" : "size-1.5")} aria-hidden="true" />
      {rating}
    </span>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-[0.75rem] font-medium text-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="flex h-full min-h-[332px] flex-col items-center justify-center text-center">
      <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface">
        <ShieldCheck className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-[0.875rem] font-semibold text-foreground">No validation yet</h3>
      <p className="mt-1 max-w-xs text-[0.8125rem] leading-5 text-muted-foreground">
        Pick a customer, add one or more portfolio lines, then validate to see the margin band and
        rating per channel.
      </p>
    </div>
  );
}
