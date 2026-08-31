import { DEAL_STAGE_LABELS } from "@/lib/serverprice/data";
import type { DealStage } from "@/lib/serverprice/types";
import { cn } from "@/lib/utils";

const STAGE_TONE: Record<DealStage, string> = {
  discovery: "text-muted-foreground border-border-strong bg-secondary/60",
  "technical-validation": "text-accent border-accent/30 bg-accent-soft",
  "bom-finalized": "text-accent border-accent/30 bg-accent-soft",
  "pricing-approval": "text-warning border-warning/30 bg-warning/10",
  contract: "text-warning border-warning/30 bg-warning/10",
  "closed-won": "text-success border-success/30 bg-success/10",
  "closed-lost": "text-destructive border-destructive/30 bg-destructive/10",
};

export function StagePill({ stage, className }: { stage: DealStage; className?: string }) {
  return (
    <span className={cn("status-pill", STAGE_TONE[stage], className)}>
      <span className="status-dot" />
      {DEAL_STAGE_LABELS[stage]}
    </span>
  );
}
