import { ShieldOff } from "lucide-react";
import type { ReactNode } from "react";
import { useViewRole } from "@/hooks/use-view-role";
import { STAKEHOLDER_ROLE_LABELS } from "@/lib/serverprice/data";
import type { StakeholderRole } from "@/lib/serverprice/types";

/**
 * Blocks a whole page for roles listed in `blockedFor`, showing a plain
 * "Limited access" message instead. Client-side only — this simulates a
 * scoped external-partner experience for the demo, it isn't real
 * authorization (see useViewRole).
 */
export function RoleGate({
  blockedFor,
  reason,
  children,
}: {
  blockedFor: StakeholderRole[];
  reason: string;
  children: ReactNode;
}) {
  const { role } = useViewRole();
  if (!blockedFor.includes(role)) return <>{children}</>;

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-muted text-muted-foreground">
        <ShieldOff className="size-5" strokeWidth={1.8} />
      </div>
      <h1 className="mt-4 text-page-title text-foreground">Limited access</h1>
      <p className="mt-2 max-w-sm text-[0.8125rem] leading-5 text-muted-foreground">{reason}</p>
      <p className="mt-4 text-meta">
        Viewing as {STAKEHOLDER_ROLE_LABELS[role]} — use the role switcher to view as someone else.
      </p>
    </main>
  );
}
