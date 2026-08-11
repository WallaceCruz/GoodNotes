import { CalendarClock } from "lucide-react";
import { PRIORITIES, PRIORITY_ICON, PRIORITY_LABEL, type Note, type Priority } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { deadlineInfo, priorityClass, toDateInput, fromDateInput } from "./note-style";

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        priorityClass[priority],
      )}
    >
      {PRIORITY_ICON[priority]} {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function DeadlineBadge({ deadline }: { deadline: number }) {
  const info = deadlineInfo(deadline);
  if (!info) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        info.tone,
      )}
      title={info.date}
    >
      <CalendarClock className="h-3 w-3" />
      {info.label}
    </span>
  );
}

export function PriorityDeadlineControls({
  note,
  onChange,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {PRIORITIES.map((p) => (
        <button
          key={p}
          onClick={() => onChange({ priority: note.priority === p ? null : p })}
          className={cn(
            "rounded-full border px-1.5 py-0.5 text-[10px]",
            note.priority === p ? priorityClass[p] : "border-border/70 bg-background/40 text-foreground/60",
          )}
        >
          {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
        </button>
      ))}
      <input
        type="date"
        aria-label="Prazo de conclusão"
        value={toDateInput(note.deadline)}
        onChange={(e) => onChange({ deadline: fromDateInput(e.target.value) })}
        className="rounded-md border border-border/70 bg-background/40 px-1.5 py-0.5 text-[10px] outline-none"
      />
    </div>
  );
}
