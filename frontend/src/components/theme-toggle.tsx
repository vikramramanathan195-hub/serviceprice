import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "relative flex shrink-0 items-center rounded-full border border-sidebar-border bg-sidebar-accent/40 p-0.5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-0.5 left-0.5 size-6 rounded-full bg-sidebar-primary/20 ring-1 ring-sidebar-primary/40 transition-transform duration-200 ease-out",
          isDark && "translate-x-6",
        )}
      />
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        aria-label="Light mode"
        onClick={() => isDark && toggle()}
        className={cn(
          "focus-ring relative z-10 flex size-6 items-center justify-center rounded-full transition-colors",
          !isDark
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/40 hover:text-sidebar-foreground/70",
        )}
      >
        <Sun className="size-3.5" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        aria-label="Dark mode"
        onClick={() => !isDark && toggle()}
        className={cn(
          "focus-ring relative z-10 flex size-6 items-center justify-center rounded-full transition-colors",
          isDark
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/40 hover:text-sidebar-foreground/70",
        )}
      >
        <Moon className="size-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
}
