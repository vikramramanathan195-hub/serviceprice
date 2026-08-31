import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { StakeholderRole } from "@/lib/serverprice/types";

const STORAGE_KEY = "serverprice-view-role";
const DEFAULT_ROLE: StakeholderRole = "country-head-sales";

/**
 * Simulates viewing the app as one of the four deal stakeholders — a UI
 * convenience for demoing role-based visibility, not real access control.
 * There's no server-side enforcement behind it; a determined user can see
 * everything by switching roles freely. Lives in a shared context (not just
 * localStorage) so every consumer — the switcher, the calculator, the BOM
 * screen, the access gates — reacts to a change in the same render pass.
 */
const ViewRoleContext = createContext<{
  role: StakeholderRole;
  setRole: (role: StakeholderRole) => void;
} | null>(null);

export function ViewRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<StakeholderRole>(DEFAULT_ROLE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as StakeholderRole | null;
      if (stored) setRoleState(stored);
    } catch {
      // Private browsing / storage disabled — falls back to the default role.
    }
  }, []);

  const setRole = (next: StakeholderRole) => {
    setRoleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisted this session, but the in-memory state still updates.
    }
  };

  return <ViewRoleContext.Provider value={{ role, setRole }}>{children}</ViewRoleContext.Provider>;
}

export function useViewRole() {
  const ctx = useContext(ViewRoleContext);
  if (!ctx) throw new Error("useViewRole must be used within a ViewRoleProvider");
  return ctx;
}
