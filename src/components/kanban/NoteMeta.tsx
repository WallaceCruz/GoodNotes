import { CalendarClock } from "lucide-react";
import { PRIORITY_ICON, PRIORITY_LABEL, type Priority } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { deadlineInfo, priorityClass } from "./note-style";

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
