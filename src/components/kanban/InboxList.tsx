import { Archive, MessageSquare } from "lucide-react";
import type { Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { stripHtml, timeAgo } from "./note-style";
import { DeadlineBadge, PriorityBadge } from "./NoteMeta";

export function InboxList({
  notes,
  activeId,
  onSelect,
}: {
  notes: Note[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="flex w-80 shrink-0 flex-col border-r border-border bg-background">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Inbox</h2>
        <span className="text-xs text-muted-foreground">{notes.length}</span>
      </header>
      <div className="scroll-thin flex-1 overflow-y-auto">
        {notes.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma nota por aqui ainda.</p>
        )}
        {notes.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={cn(
              "block w-full border-b border-border px-4 py-3 text-left hover:bg-accent",
              activeId === n.id && "bg-accent",
            )}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{n.author}</span>
              {n.archived && <Archive className="h-3 w-3" />}
              <span className="ml-auto">{timeAgo(n.updatedAt)}</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-snug">{n.title}</p>
            {(n.priority || n.deadline) && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {n.priority && <PriorityBadge priority={n.priority} />}
                {n.deadline && <DeadlineBadge deadline={n.deadline} />}
              </div>
            )}
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {stripHtml(n.content)}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
