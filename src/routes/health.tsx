import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  Gauge,
  Info,
  RefreshCw,
  Timer,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { healthQueryOptions } from "@/lib/serverprice/queries";
import type { HealthSnapshot } from "@/lib/serverprice/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "System Health — ServerPrice Ops" },
      {
        name: "description",
        content:
          "Live service telemetry for the ServerPrice platform: concurrent users, latency, error rate and request volume.",
      },
      { property: "og:title", content: "System Health — ServerPrice Ops" },
      {
        property: "og:description",
        content: "Live service telemetry for the ServerPrice pricing platform.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(healthQueryOptions());
  },
  component: HealthPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-destructive">
      Telemetry unavailable: {error.message}
    </div>
  ),
});

function HealthPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Operations"
        title="System Health"
        description="Live telemetry for the pricing platform. Sampled every 5 seconds from the edge collector."
        meta={
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span className="text-[0.75rem] font-medium text-foreground">
              Streaming<span className="sr-only"> — telemetry is live</span>
            </span>
          </div>
        }
        actions={
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[0.8125rem] font-medium text-foreground shadow-card transition-all hover:border-border-strong hover:bg-surface-muted active:scale-[0.985]"
          >
            <RefreshCw className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Refresh now
          </button>
        }
      />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-6 py-6 lg:px-8">
        <Suspense fallback={<HealthSkeleton />}>
          <HealthContent />
        </Suspense>
      </main>
    </AppShell>
  );
}

function HealthContent() {
  const { data } = useSuspenseQuery(healthQueryOptions());

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Concurrent users"
          value={data.concurrentUsers.toLocaleString()}
          unit="sessions"
          delta={data.deltas.concurrentUsers}
          deltaGood="up"
          footnote="Active in the last 60s"
        />
        <StatCard
          icon={Timer}
          label="Avg response time"
          value={data.avgResponseMs.toString()}
          unit="ms"
          delta={data.deltas.avgResponseMs}
          deltaGood="down"
          footnote={`p95 ${data.p95ResponseMs} ms`}
        />
        <StatCard
          icon={CircleAlert}
          label="Error rate"
          value={data.errorRatePercent.toFixed(2)}
          unit="%"
          delta={data.deltas.errorRatePercent}
          deltaGood="down"
          footnote="5xx + failed dependency calls"
          tone={data.errorRatePercent > 1 ? "warning" : "default"}
        />
        <StatCard
          icon={Activity}
          label="Request volume"
          value={data.requestsPerMinute.toLocaleString()}
          unit="req/min"
          delta={data.deltas.requestsPerMinute}
          deltaGood="up"
          footnote={`Uptime ${data.uptimePercent}% (30d)`}
        />
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-section-title text-foreground">Request volume — last 60 minutes</h2>
            <p className="mt-0.5 text-meta">1-minute buckets, aggregated across all edge regions</p>
          </div>
          <div className="flex items-center gap-4">
            <LegendDot className="bg-primary" label="Requests" />
            <LegendDot className="bg-destructive" label="Errors" />
          </div>
        </div>
        <div className="px-3 py-5 pr-6">
          <VolumeChart series={data.series} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-section-title text-foreground">Service breakdown</h2>
            <span className="text-meta">p50 latency · 5 min window</span>
          </div>
          <table className="w-full text-[0.8125rem]">
            <caption className="sr-only">Per-service status, p50 latency and error rate</caption>
            <thead>
              <tr className="border-b border-border bg-surface-muted/70">
                <th scope="col" className="px-6 py-2.5 text-left text-eyebrow">
                  Service
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-eyebrow">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 text-right text-eyebrow">
                  Latency
                </th>
                <th scope="col" className="px-6 py-2.5 text-right text-eyebrow">
                  Error rate
                </th>
              </tr>
            </thead>

            <tbody>
              {data.services.map((s, rowIndex) => (
                <tr
                  key={s.name}
                  style={{ animationDelay: `${rowIndex * 30}ms` }}
                  className="row-enter border-b border-border/70 transition-colors last:border-0 hover:bg-surface-muted"
                >
                  <td className="px-6 py-3 font-mono text-[0.75rem] font-medium text-foreground">
                    {s.name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={s.status} />
                  </td>
                  <td
                    className={cn(
                      "tabular px-4 py-3 text-right",
                      s.latencyMs > 400 ? "font-semibold text-warning" : "text-foreground",
                    )}
                  >
                    {s.latencyMs} ms
                  </td>
                  <td
                    className={cn(
                      "tabular px-6 py-3 text-right",
                      s.errorRatePercent > 1
                        ? "font-semibold text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {s.errorRatePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-section-title text-foreground">Event log</h2>
            <Badge variant="secondary" className="rounded px-1.5 text-[0.6875rem]">
              {data.incidents.length} in 2h
            </Badge>
          </div>
          <ul className="divide-y divide-border/70">
            {data.incidents.map((e, rowIndex) => {
              const Icon =
                e.level === "error" ? AlertTriangle : e.level === "warn" ? CircleAlert : Info;
              return (
                <li
                  key={e.id}
                  style={{ animationDelay: `${rowIndex * 40}ms` }}
                  className="row-enter flex gap-3 px-6 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      e.level === "error"
                        ? "text-destructive"
                        : e.level === "warn"
                          ? "text-warning"
                          : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] leading-5 text-foreground">
                      <span className="sr-only">{e.level} event: </span>
                      {e.message}
                    </p>
                    <p
                      suppressHydrationWarning
                      className="mt-0.5 font-mono text-[0.6875rem] text-muted-foreground"
                    >
                      {e.id} · {new Date(e.at).toLocaleTimeString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function VolumeChart({ series }: { series: HealthSnapshot["series"] }) {
  const data = series.map((s) => ({
    ...s,
    label: new Date(s.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  const peak = data.reduce((m, d) => Math.max(m, d.requests), 0);
  const totalErrors = data.reduce((s, d) => s + d.errors, 0);

  return (
    <div className="h-[280px] w-full">
      <p className="sr-only">
        Line chart of request volume over the last 60 minutes. Peak {peak} requests per minute,{" "}
        {totalErrors} errors in total.
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          accessibilityLayer
          data={data}
          role="img"
          aria-label="Request volume and errors per minute over the last 60 minutes"
          margin={{ top: 8, right: 8, bottom: 4, left: 8 }}
        >
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            interval={11}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickMargin={10}
            label={{
              value: "Time (local)",
              position: "insideBottom",
              offset: -2,
              style: { fontSize: 11, fill: "var(--muted-foreground)" },
            }}
          />
          <YAxis
            width={62}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
            label={{
              value: "Requests / min",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "var(--muted-foreground)", textAnchor: "middle" },
            }}
          />
          <RTooltip
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-overlay">
                  <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-1.5 space-y-1">
                    <Row label="Requests" value={`${payload[0]?.payload.requests} /min`} />
                    <Row label="Errors" value={`${payload[0]?.payload.errors}`} />
                    <Row label="Latency" value={`${payload[0]?.payload.latencyMs} ms`} />
                  </div>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#volumeFill)"
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: "var(--surface)" }}
          />
          <Line
            type="monotone"
            dataKey="errors"
            stroke="var(--destructive)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 text-[0.75rem]">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-semibold text-foreground">{value}</span>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground">
      <span className={cn("size-2 rounded-full", className)} aria-hidden="true" />
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: "operational" | "degraded" | "down" }) {
  const map = {
    operational: "bg-success/10 text-success border-success/40",
    degraded: "bg-warning/15 text-warning border-warning/50",
    down: "bg-destructive/10 text-destructive border-destructive/40",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold capitalize",
        map[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      <span className="sr-only">Status: </span>
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  deltaGood,
  footnote,
  tone = "default",
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  unit: string;
  delta: number;
  deltaGood: "up" | "down";
  footnote: string;
  tone?: "default" | "warning";
}) {
  const positive = delta >= 0;
  const good = deltaGood === "up" ? positive : !positive;
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="surface-card group p-5 transition-all duration-200 hover:-translate-y-px hover:shadow-raised">
      <div className="flex items-center justify-between">
        <span className="text-eyebrow">{label}</span>
        <Icon
          aria-hidden="true"
          className={cn(
            "size-4 transition-colors",
            tone === "warning" ? "text-warning" : "text-muted-foreground group-hover:text-accent",
          )}
          strokeWidth={2}
        />
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="tabular text-[1.75rem] font-semibold leading-none tracking-tight text-foreground">
          {value}
        </span>
        <span className="text-[0.8125rem] font-medium text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
        <span className="text-meta">{footnote}</span>
        <span
          className={cn(
            "tabular inline-flex items-center gap-0.5 text-[0.75rem] font-semibold",
            good ? "text-success" : "text-destructive",
          )}
        >
          <DeltaIcon className="size-3.5" aria-hidden="true" />
          <span className="sr-only">{positive ? "Up " : "Down "}</span>
          {Math.abs(delta)}%
        </span>
      </div>
    </div>
  );
}

function HealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="surface-card p-6">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="mt-6 h-[248px] w-full" />
      </div>
    </div>
  );
}
