import { Briefcase, Factory, Globe2, UserCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useViewRole } from "@/hooks/use-view-role";
import { STAKEHOLDER_ROLE_LABELS } from "@/lib/serverprice/data";
import type { StakeholderRole } from "@/lib/serverprice/types";

const ROLE_ORDER: StakeholderRole[] = [
  "senior-leadership",
  "country-head-sales",
  "manufacturing-rd",
  "external-partner",
];

const ROLE_ICON: Record<StakeholderRole, typeof Briefcase> = {
  "senior-leadership": Briefcase,
  "country-head-sales": Globe2,
  "manufacturing-rd": Factory,
  "external-partner": Factory,
};

export function RoleSwitcher({ className }: { className?: string }) {
  const { role, setRole } = useViewRole();
  const Icon = ROLE_ICON[role];

  return (
    <Select value={role} onValueChange={(v) => setRole(v as StakeholderRole)}>
      <SelectTrigger
        aria-label="Viewing as"
        className={className ?? "h-8 w-[220px] gap-2 border-border bg-surface-muted text-[0.75rem]"}
      >
        <UserCircle2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">
          <span className="text-muted-foreground">Viewing as </span>
          <span className="font-medium text-foreground">{STAKEHOLDER_ROLE_LABELS[role]}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {ROLE_ORDER.map((r) => {
          const RoleIcon = ROLE_ICON[r];
          return (
            <SelectItem key={r} value={r} className="text-[0.8125rem]">
              <span className="flex items-center gap-2">
                <RoleIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                {STAKEHOLDER_ROLE_LABELS[r]}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
