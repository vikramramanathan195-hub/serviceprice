import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowUpRight, Briefcase, CircleDollarSign, Search, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StagePill } from "@/components/deals/stage-pill";
import { RackLoader, RackMark } from "@/components/rack-mark";
import { useCountUp } from "@/hooks/use-count-up";
import { currency } from "@/lib/serverprice/discount";
import { DEAL_STAGE_LABELS, REGION_LABELS } from "@/lib/serverprice/data";
import { dealsQueryOptions } from "@/lib/serverprice/queries";
import type { DealStage, Region } from "@/lib/serverprice/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deal Desk — ServerPrice" },
      {
        name: "description",
        content:
          "Track hardware deals from discovery to close: BOM, pricing, and stakeholder sign-off in one place.",
      },
      { property: "og:title", content: "Deal Desk — ServerPrice" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(dealsQueryOptions());
  },
  component: DealsList,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-destructive">
      Deals unavailable: {error.message}
    </div>
  ),
});

function DealsList() {
  const { data: deals = [], isLoading } = useQuery(dealsQueryOptions());
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<DealStage | "all">("all");
  const [region, setRegion] = useState<Region | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter(
      (d) =>
        (stage === "all" || d.stage === stage) &&
        (region === "all" || d.region === region) &&
        (!q || d.name.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q)),
    );
  }, [deals, search, stage, region]);

  const openDeals = deals.filter((d) => d.stage !== "closed-won" && d.stage !== "closed-lost");
  const pipelineValue = openDeals.reduce((s, d) => s + d.bomTotal, 0);
  const awaitingSignoff = openDeals.reduce(
    (s, d) => s + Math.max(0, d.stakeholdersTotal - d.stakeholdersApproved),
    0,
  );
  const featured = [...openDeals].sort((a, b) => b.bomTotal - a.bomTotal)[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Deal desk"
        title="Active Deals"
        description="Every hardware deal in flight — BOM value, stage, and stakeholder sign-off at a glance."
      />

      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-8 px-6 py-8 lg:px-8">
        {/* Asymmetric hero row: the biggest live deal dominates, two supporting
            stats sit beside it at lower visual weight — not a uniform 3-col grid. */}
        <section
          className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]"
          aria-label="Pipeline overview"
        >
          {isLoading ? (
            <Skeleton className="h-48 rounded-2xl lg:col-span-1" />
          ) : featured ? (
            <Link
              to="/deals/$dealId"
              params={{ dealId: featured.id }}
              className="surface-hero group flex flex-col justify-between p-6 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-eyebrow text-accent">Largest active deal</div>
                  <h2 className="mt-1.5 text-[1.375rem] font-bold leading-tight tracking-tight text-foreground">
                    {featured.name}
                  </h2>
                  <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                    {featured.customerName}
                  </p>
                </div>
                <StagePill stage={featured.stage} />
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <div className="text-eyebrow">BOM value</div>
                  <CountUpCurrency
                    value={featured.bomTotal}
                    className="text-display mt-1 block text-foreground"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  Open deal
                  <ArrowUpRight className="size-4" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="surface-card flex h-48 items-center justify-center text-sm text-muted-foreground">
              No active deals
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-rows-2">
            <SummaryTile
              icon={Briefcase}
              label="Open deals"
              value={String(openDeals.length)}
              loading={isLoading}
            />
            <SummaryTile
              icon={CircleDollarSign}
              label="Open pipeline value"
              value={<CountUpCurrency value={pipelineValue} />}
              loading={isLoading}
              accent
            />
            <SummaryTile
              icon={Users}
              label="Sign-offs pending"
              value={String(awaitingSignoff)}
              loading={isLoading}
              className="col-span-2"
            />
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deal or customer name…"
                className="h-9 border-border bg-surface-muted pl-9 text-[0.8125rem]"
              />
            </div>
            <Select value={stage} onValueChange={(v) => setStage(v as DealStage | "all")}>
              <SelectTrigger className="h-9 w-full border-border bg-surface-muted text-[0.8125rem] sm:w-48">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={region} onValueChange={(v) => setRegion(v as Region | "all")}>
              <SelectTrigger className="h-9 w-full border-border bg-surface-muted text-[0.8125rem] sm:w-44">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {Object.entries(REGION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-border">
            {isLoading && (
              <div className="flex justify-center px-5 py-16">
                <RackLoader label="Loading pipeline…" />
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-5 py-16 text-center text-sm text-muted-foreground">
                <RackMark />
                No deals match these filters.
              </div>
            )}

            {!isLoading &&
              filtered.map((deal, rowIndex) => (
                <Link
                  key={deal.id}
                  to="/deals/$dealId"
                  params={{ dealId: deal.id }}
                  style={{ animationDelay: `${Math.min(rowIndex * 30, 300)}ms` }}
                  className="row-enter group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.875rem] font-semibold text-foreground">
                      {deal.name}
                    </div>
                    <div className="mt-0.5 truncate text-[0.75rem] text-muted-foreground">
                      {deal.customerName} · {REGION_LABELS[deal.region]}
                    </div>
                  </div>

                  <div className="hidden w-40 shrink-0 sm:block">
                    <div className="text-eyebrow">Stakeholders</div>
                    <div className="tabular mt-0.5 text-[0.8125rem] font-medium text-foreground">
                      {deal.stakeholdersApproved}/{deal.stakeholdersTotal} approved
                    </div>
                  </div>

                  <div className="hidden w-32 shrink-0 text-right sm:block">
                    <div className="text-eyebrow">BOM total</div>
                    <div className="tabular mt-0.5 text-[0.8125rem] font-semibold text-foreground">
                      {currency(deal.bomTotal)}
                    </div>
                  </div>

                  <StagePill stage={deal.stage} className="shrink-0" />

                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-accent" />
                </Link>
              ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  loading,
  accent,
  className,
}: {
  icon: typeof Briefcase;
  label: string;
  value: React.ReactNode;
  loading?: boolean;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("surface-card hover-lift flex flex-col justify-between p-4", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={2.25} />
        <span className="text-eyebrow">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : (
        <div
          className={cn(
            "tabular mt-1.5 text-[1.375rem] font-bold leading-none tracking-tight",
            accent ? "text-accent" : "text-foreground",
          )}
        >
          {value}
        </div>
      )}
    </div>
  );
}

function CountUpCurrency({ value, className }: { value: number; className?: string }) {
  const animated = useCountUp(value);
  return <span className={cn("tabular", className)}>{currency(animated)}</span>;
}
