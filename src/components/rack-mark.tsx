import { cn } from "@/lib/utils";

/**
 * The app's one signature motif: three rack bars, like the LED strip on a
 * server chassis. `RackLoader` pulses them for loading states; `RackMark`
 * is the static version used in empty states. Nothing else gets decorated
 * with it — one memorable detail, used consistently.
 */

export function RackLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)} role="status">
      <span className="rack-loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={label ? "text-meta" : "sr-only"}>{label ?? "Loading"}</span>
    </div>
  );
}

export function RackMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex w-7 flex-col gap-1", className)}>
      <span className="block h-1 rounded-full bg-accent/70" />
      <span className="block h-1 w-4/5 rounded-full bg-accent/40" />
      <span className="block h-1 w-3/5 rounded-full bg-accent/20" />
    </span>
  );
}
