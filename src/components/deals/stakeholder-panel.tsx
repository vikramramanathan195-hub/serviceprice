import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Check, Clock, Factory, Globe2, Loader2, Lock } from "lucide-react";
import { STAKEHOLDER_ROLE_LABELS } from "@/lib/serverprice/data";
import { api, queryKeys } from "@/lib/serverprice/api";
import type {
  Deal,
  Stakeholder,
  StakeholderRole,
  StakeholderStatus,
} from "@/lib/serverprice/types";
import { cn } from "@/lib/utils";

const ROLE_ICON: Record<StakeholderRole, typeof Briefcase> = {
  "senior-leadership": Briefcase,
  "country-head-sales": Globe2,
  "manufacturing-rd": Factory,
  "external-partner": Factory,
};

const STATUS_TONE: Record<StakeholderStatus, string> = {
  pending: "text-muted-foreground border-border-strong bg-secondary/60",
  reviewed: "text-warning border-warning/30 bg-warning/10",
  approved: "text-success border-success/30 bg-success/10",
};

const STATUS_LABEL: Record<StakeholderStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  approved: "Approved",
};

const NEXT_STATUS: Record<StakeholderStatus, StakeholderStatus | null> = {
  pending: "reviewed",
  reviewed: "approved",
  approved: null,
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function StakeholderPanel({ deal }: { deal: Deal }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ role, status }: { role: StakeholderRole; status: StakeholderStatus }) =>
      api.signoffStakeholder(deal.id, role, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.deal(deal.id), updated);
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  return (
    <section aria-labelledby="stakeholders-heading">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 id="stakeholders-heading" className="text-section-title text-foreground">
          Stakeholder sign-off
        </h2>
        <span className="text-meta tabular">
          {deal.stakeholders.filter((s) => s.status === "approved" || !s.required).length}/
          {deal.stakeholders.length} cleared
        </span>
      </div>
      <p className="text-meta mb-3">
        Country Head/Sales → Manufacturing/R&D + External Partner → Senior Leadership
        {!deal.stakeholders.find((s) => s.role === "senior-leadership")?.required &&
          " (not required — no BOM line exceeds the 20% escalation threshold)"}
      </p>

      {mutation.isError && (
        <p className="mb-3 text-[0.75rem] text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Could not update this stakeholder."}
        </p>
      )}

      {/* Deliberately not a uniform grid — locked/pending stakeholders carry
          more visual weight (raised surface) than ones already cleared. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {deal.stakeholders.map((s) => (
          <StakeholderCard
            key={s.role}
            stakeholder={s}
            pending={mutation.isPending && mutation.variables?.role === s.role}
            onAdvance={() => {
              const next = NEXT_STATUS[s.status];
              if (next) mutation.mutate({ role: s.role, status: next });
            }}
          />
        ))}
      </div>
    </section>
  );
}

function StakeholderCard({
  stakeholder,
  pending,
  onAdvance,
}: {
  stakeholder: Stakeholder;
  pending: boolean;
  onAdvance: () => void;
}) {
  const Icon = ROLE_ICON[stakeholder.role];
  const isDone = stakeholder.status === "approved";
  const isOptionalIdle = !stakeholder.required && stakeholder.status === "pending";
  const date = formatDate(stakeholder.signedAt);

  return (
    <div
      className={cn(
        "hover-lift flex flex-col justify-between p-4",
        isDone || isOptionalIdle ? "surface-card opacity-80" : "surface-raised",
        stakeholder.locked && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-3.5" strokeWidth={2.25} />
          <span className="text-eyebrow">{STAKEHOLDER_ROLE_LABELS[stakeholder.role]}</span>
        </div>
        {isDone && <Check className="size-3.5 text-success" strokeWidth={2.5} />}
        {stakeholder.locked && (
          <Lock className="size-3.5 text-muted-foreground/60" strokeWidth={2.25} />
        )}
      </div>

      <div className="mt-3">
        <div className="text-[0.9375rem] font-semibold text-foreground">{stakeholder.name}</div>
        <div className="text-[0.75rem] text-muted-foreground">{stakeholder.title}</div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className={cn("status-pill", STATUS_TONE[stakeholder.status])}>
          <span className="status-dot" />
          {STATUS_LABEL[stakeholder.status]}
        </span>
        {date && (
          <span className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
            <Clock className="size-3" />
            {date}
          </span>
        )}
      </div>

      {!stakeholder.required && (
        <p className="mt-2 text-[0.6875rem] text-muted-foreground">Not required for this BOM</p>
      )}

      {stakeholder.locked && stakeholder.lockReason && (
        <p className="mt-2 flex items-start gap-1.5 text-[0.6875rem] text-muted-foreground">
          <Lock className="mt-0.5 size-2.5 shrink-0" />
          {stakeholder.lockReason}
        </p>
      )}

      {!isDone && !stakeholder.locked && stakeholder.required && (
        <button
          type="button"
          onClick={onAdvance}
          disabled={pending}
          className="focus-ring mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border-strong bg-secondary/40 py-1.5 text-[0.75rem] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3 animate-spin" />}
          Mark {stakeholder.status === "pending" ? "reviewed" : "approved"}
        </button>
      )}

      {!isDone && !stakeholder.locked && !stakeholder.required && (
        <button
          type="button"
          onClick={onAdvance}
          disabled={pending}
          className="focus-ring mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-[0.75rem] font-medium text-muted-foreground transition-colors hover:bg-secondary/30 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3 animate-spin" />}
          Mark {stakeholder.status === "pending" ? "reviewed" : "approved"} anyway
        </button>
      )}
    </div>
  );
}
