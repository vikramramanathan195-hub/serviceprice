import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, Undo2, XCircle } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/role-gate";
import { RoleSwitcher } from "@/components/role-switcher";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StagePill } from "@/components/deals/stage-pill";
import { StakeholderPanel } from "@/components/deals/stakeholder-panel";
import { BomLedger } from "@/components/deals/bom-ledger";
import { TimelineFeed } from "@/components/deals/timeline-feed";
import { useCountUp } from "@/hooks/use-count-up";
import { api, queryKeys } from "@/lib/serverprice/api";
import { currency } from "@/lib/serverprice/discount";
import { DEAL_STAGE_LABELS, DEAL_STAGE_ORDER, REGION_LABELS } from "@/lib/serverprice/data";
import { dealQueryOptions } from "@/lib/serverprice/queries";

export const Route = createFileRoute("/deals/$dealId")({
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.name} — Deal Desk` : "Deal — Deal Desk" }],
  }),
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(dealQueryOptions(params.dealId));
  },
  component: DealDetail,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-destructive">
      Deal unavailable: {error.message}
    </div>
  ),
});

function DealDetail() {
  const { dealId } = Route.useParams();
  const { data: deal, isLoading } = useQuery(dealQueryOptions(dealId));
  const queryClient = useQueryClient();
  const [pendingStage, setPendingStage] = useState<string | null>(null);

  const stageMutation = useMutation({
    mutationFn: (stage: string) => api.changeDealStage(dealId, stage as never),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.deal(dealId), updated);
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  const revertMutation = useMutation({
    mutationFn: () => api.revertDealStage(dealId),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.deal(dealId), updated);
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  if (isLoading || !deal) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 px-6 py-8 lg:px-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const closed = deal.stage === "closed-won" || deal.stage === "closed-lost";
  const currentIdx = DEAL_STAGE_ORDER.indexOf(deal.stage);
  const nextStage = !closed && currentIdx >= 0 ? DEAL_STAGE_ORDER[currentIdx + 1] : undefined;

  const bomTotal = deal.bom.reduce((s, i) => s + i.lineTotal, 0);
  const listTotal = deal.bom.reduce((s, i) => s + i.unitListPrice * i.quantity * i.termMonths, 0);
  const totalUnits = deal.bom.reduce((s, i) => s + i.quantity, 0);
  const savingsPercent = listTotal > 0 ? ((listTotal - bomTotal) / listTotal) * 100 : 0;

  return (
    <AppShell>
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="min-w-0">
            <Link
              to="/"
              className="focus-ring inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              All deals
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              <h1 className="text-page-title text-foreground">{deal.name}</h1>
              <StagePill stage={deal.stage} />
            </div>
            <p className="mt-1 text-[0.8125rem] text-muted-foreground">
              {deal.customerName} · {REGION_LABELS[deal.region]}
            </p>
            <div className="mt-3 lg:hidden">
              <RoleSwitcher className="h-8 w-full max-w-xs gap-2 border-border bg-surface-muted text-[0.75rem]" />
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              {deal.previousStage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-[0.75rem] text-muted-foreground hover:text-foreground"
                  disabled={revertMutation.isPending}
                  onClick={() => revertMutation.mutate()}
                >
                  {revertMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Undo2 className="size-3.5" />
                  )}
                  Undo — back to {DEAL_STAGE_LABELS[deal.previousStage]}
                </Button>
              )}
              {!closed && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-destructive/30 text-[0.75rem] text-destructive hover:bg-destructive/10"
                    disabled={stageMutation.isPending}
                    onClick={() => setPendingStage("closed-lost")}
                  >
                    <XCircle className="size-3.5" />
                    Mark lost
                  </Button>
                  {nextStage && (
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-[0.75rem]"
                      disabled={stageMutation.isPending}
                      onClick={() => setPendingStage(nextStage)}
                    >
                      {stageMutation.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="size-3.5" />
                      )}
                      Advance to {DEAL_STAGE_LABELS[nextStage]}
                    </Button>
                  )}
                </>
              )}
            </div>
            {stageMutation.isError && (
              <p className="max-w-xs text-right text-[0.75rem] text-destructive">
                {stageMutation.error instanceof Error
                  ? stageMutation.error.message
                  : "Could not change stage."}
              </p>
            )}
            {revertMutation.isError && (
              <p className="max-w-xs text-right text-[0.75rem] text-destructive">
                {revertMutation.error instanceof Error
                  ? revertMutation.error.message
                  : "Could not undo the last stage change."}
              </p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={pendingStage !== null}
        onOpenChange={(open) => !open && setPendingStage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStage === "closed-lost"
                ? "Mark this deal as lost?"
                : `Advance to ${pendingStage ? DEAL_STAGE_LABELS[pendingStage as keyof typeof DEAL_STAGE_LABELS] : ""}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStage === "closed-lost"
                ? "This closes the deal. You can undo this immediately after, but not once you've navigated away and made further changes."
                : "This logs a timeline event and can only be undone with a single-step revert right after — it won't persist through further stage changes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStage) stageMutation.mutate(pendingStage);
                setPendingStage(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoleGate
        blockedFor={["external-partner"]}
        reason="External partners see manufacturing cost and lead time for their own component only — not deal economics or customer terms. Open a product's Manufacturing BOM to see your component."
      >
        <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-8 px-6 py-8 lg:px-8">
          {/* Hero: BOM total is the one number on this page that should
              dominate — everything else here is supporting context. */}
          <section className="surface-hero grid grid-cols-1 gap-6 p-6 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="text-eyebrow text-accent">
                BOM total ({deal.bom.length} line items)
              </div>
              <AnimatedTotal value={bomTotal} />
              {savingsPercent > 0 && (
                <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                  <span className="tabular font-medium text-success">
                    −{savingsPercent.toFixed(1)}%
                  </span>{" "}
                  vs {currency(listTotal)} list
                </p>
              )}
            </div>
            <HeroStat label="Total units" value={totalUnits.toLocaleString("en-US")} />
            <HeroStat
              label="Stakeholders cleared"
              value={`${deal.stakeholders.filter((s) => s.status === "approved" || !s.required).length}/${deal.stakeholders.length}`}
            />
          </section>

          <StakeholderPanel deal={deal} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr] xl:items-start">
            <BomLedger deal={deal} />
            <TimelineFeed events={deal.timeline} />
          </div>
        </main>
      </RoleGate>
    </AppShell>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center border-l border-border pl-6">
      <div className="text-eyebrow">{label}</div>
      <div className="tabular mt-1 text-[1.625rem] font-bold leading-none tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

function AnimatedTotal({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <div className="text-display mt-1.5 text-foreground">{currency(animated)}</div>;
}
