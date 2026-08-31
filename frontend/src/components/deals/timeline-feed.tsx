import { CircleDot, MessageSquare, Package, UserCheck } from "lucide-react";
import type { TimelineEvent, TimelineEventType } from "@/lib/serverprice/types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<TimelineEventType, typeof CircleDot> = {
  "stage-change": CircleDot,
  "stakeholder-signoff": UserCheck,
  "bom-edit": Package,
  note: MessageSquare,
};

const TYPE_TONE: Record<TimelineEventType, string> = {
  "stage-change": "text-accent bg-accent-soft",
  "stakeholder-signoff": "text-success bg-success/10",
  "bom-edit": "text-muted-foreground bg-secondary/60",
  note: "text-warning bg-warning/10",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TimelineFeed({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section className="surface-card p-5" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="text-section-title text-foreground">
        Timeline
      </h2>

      <ol className="mt-4 space-y-0">
        {sorted.map((event, i) => {
          const Icon = TYPE_ICON[event.type];
          return (
            <li
              key={event.id}
              style={{ animationDelay: `${Math.min(i * 30, 360)}ms` }}
              className="row-enter relative flex gap-3 pb-5 last:pb-0"
            >
              {i !== sorted.length - 1 && (
                <span
                  className="absolute left-[0.5625rem] top-6 h-full w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "z-10 flex size-[1.125rem] shrink-0 items-center justify-center rounded-full",
                  TYPE_TONE[event.type],
                )}
              >
                <Icon className="size-3" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1 pt-px">
                <p className="text-[0.8125rem] leading-5 text-foreground">{event.message}</p>
                <p className="text-meta mt-0.5">
                  {formatWhen(event.at)}
                  {event.actor && ` · ${event.actor}`}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
