import { Bell } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { deadlineInfo } from "./note-style";
import { DeadlineBadge, PriorityBadge } from "./NoteMeta";

/** Notas com prazo vencido ou vencendo nos próximos 3 dias. */
export function useDeadlineAlerts(notes: Note[]) {
  return notes
    .filter((n) => !n.archived && n.deadline)
    .map((n) => ({ note: n, info: deadlineInfo(n.deadline)! }))
    .filter((x) => x.info.diff <= 3)
    .sort((a, b) => a.info.diff - b.info.diff);
}

export function NotificationsMenu({
  notes,
  onSelect,
}: {
  notes: Note[];
  onSelect: (id: string) => void;
}) {
  const alerts = useDeadlineAlerts(notes);
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const a of alerts) {
      const key = `${a.note.id}:${a.info.label}`;
      if (notified.current.has(key)) continue;
      notified.current.add(key);
      const message = `${a.note.title || "Nota"} — ${a.info.label}`;
      if (a.info.diff < 0) toast.error(message, { description: `Prazo: ${a.info.date}` });
      else toast.warning(message, { description: `Prazo: ${a.info.date}` });
    }
  }, [alerts]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notificações de prazo"
          title="Notificações de prazo"
          className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        >
          <Bell className="h-4 w-4" />
          {alerts.length > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                "bg-destructive text-destructive-foreground",
              )}
            >
              {alerts.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Lembretes de prazo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Nenhum prazo próximo.</p>
        )}
        {alerts.map(({ note }) => (
          <DropdownMenuItem
            key={note.id}
            onClick={() => onSelect(note.id)}
            className="flex flex-col items-start gap-1"
          >
            <span className="text-sm font-medium">{note.title || "Sem título"}</span>
            <span className="flex flex-wrap items-center gap-1">
              {note.priority && <PriorityBadge priority={note.priority} />}
              {note.deadline && <DeadlineBadge deadline={note.deadline} />}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
