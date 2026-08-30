import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, LayoutGrid, LifeBuoy, Server, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Pricing Dashboard", icon: LayoutGrid, group: "Sales" },
  { to: "/health", label: "System Health", icon: Activity, group: "Operations" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-primary/25">
            <Server className="size-4" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="text-[0.9375rem] font-semibold tracking-tight text-sidebar-accent-foreground">
              ServerPrice
            </div>
            <div className="text-[0.6875rem] font-medium text-sidebar-foreground/55">
              Internal · v3.4.1
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 px-3 py-4">
          {["Sales", "Operations"].map((group) => (
            <div key={group} className="space-y-1">
              <div className="px-2.5 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/45">
                {group}
              </div>
              {NAV.filter((n) => n.group === group).map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8125rem] font-medium transition-colors duration-150",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-4 transition-colors",
                        active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-primary",
                      )}
                      strokeWidth={2}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8125rem] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50">
            <LifeBuoy className="size-4 text-sidebar-foreground/45" />
            Pricing desk handbook
          </div>
          <div className="mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8125rem] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50">
            <Settings2 className="size-4 text-sidebar-foreground/45" />
            Workspace settings
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <div className="text-eyebrow">{eyebrow}</div>
          <h1 className="mt-1 text-page-title text-foreground">{title}</h1>
          <p className="mt-1 max-w-2xl text-[0.8125rem] leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {meta}
          {actions}
        </div>
      </div>
    </header>
  );
}
