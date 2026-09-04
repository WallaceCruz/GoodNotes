import { CalendarClock, CheckCircle2, Circle, Loader, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NOTE_STATUSES, STATUS_HINT, STATUS_LABEL, type NoteStatus } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { statusClass } from "./note-style";

export const STATUS_ICON: Record<NoteStatus, LucideIcon> = {
  done: CheckCircle2,
  doing: Loader,
  pending: Circle,
  undone: XCircle,
  rescheduled: CalendarClock,
};

export function StatusBadge({ status }: { status: NoteStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <span
      title={STATUS_HINT[status]}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        statusClass[status],
      )}
    >
      <Icon className="h-3 w-3" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: NoteStatus | null;
  onChange: (status: NoteStatus | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {NOTE_STATUSES.map((s) => {
        const Icon = STATUS_ICON[s];
        return (
          <button
            key={s}
            title={STATUS_HINT[s]}
            onClick={() => onChange(value === s ? null : s)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
              value === s
                ? statusClass[s]
                : "border-border bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {STATUS_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
