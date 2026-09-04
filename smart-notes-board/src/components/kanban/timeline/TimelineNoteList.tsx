import { ChevronDown, ChevronRight } from "lucide-react";
import { noteAssignees } from "@/lib/board/notes";
import { isNoteDone } from "@/lib/board/status";
import { initials } from "@/lib/text";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/note/NoteMeta";
import type { TimelineRow } from "@/lib/board/timeline";
import type { Column } from "@/lib/board/model";

/** Altura de uma linha de nota. A grade à direita usa a mesma, para alinhar. */
export const ROW_HEIGHT = "h-14";
/** Altura do cabeçalho de cada coluna, também espelhada na grade. */
export const GROUP_HEIGHT = "h-9";

const MAX_AVATARS = 3;

/** Coluna fixa à esquerda: os nomes das notas, agrupados por etapa. */
export function TimelineNoteList({
  rows,
  columns,
  collapsed,
  accentOf,
  onToggleColumn,
  onOpenNote,
}: {
  rows: TimelineRow[];
  columns: Column[];
  collapsed: Record<string, boolean>;
  accentOf: (column: Column) => string | null;
  onToggleColumn: (columnId: string) => void;
  onOpenNote: (id: string) => void;
}) {
  return (
    <div className="scroll-thin w-80 shrink-0 overflow-y-auto border-r border-border bg-background">
      <div className="sticky top-0 z-10 h-12 border-b border-border bg-background px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Notas
      </div>

      {rows.map(({ column, notes }) => {
        const accent = accentOf(column);
        return (
          <div key={column.id}>
            <button
              onClick={() => onToggleColumn(column.id)}
              className={cn(
                "flex w-full items-center gap-1.5 border-b border-border/60 px-2 text-xs font-medium text-foreground hover:bg-accent",
                GROUP_HEIGHT,
              )}
            >
              {collapsed[column.id] ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              <span
                className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"
                style={accent ? { background: accent } : undefined}
              />
              <span className="truncate">{column.title}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{notes.length}</span>
            </button>

            {!collapsed[column.id] &&
              notes.map((note) => {
                const done = isNoteDone(note, columns);
                return (
                  <button
                    key={note.id}
                    onClick={() => onOpenNote(note.id)}
                    className={cn(
                      "flex w-full items-center gap-2 border-b border-border/40 px-3 text-left hover:bg-accent",
                      ROW_HEIGHT,
                    )}
                  >
                    <span
                      className={cn(
                        "line-clamp-2 min-w-0 flex-1 text-xs leading-tight",
                        done && "text-muted-foreground line-through",
                      )}
                    >
                      {note.title || "Sem título"}
                    </span>
                    <span className="flex shrink-0 -space-x-1.5">
                      {noteAssignees(note)
                        .slice(0, MAX_AVATARS)
                        .map((name) => (
                          <span
                            key={name}
                            title={name}
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[9px] font-medium"
                          >
                            {initials(name)}
                          </span>
                        ))}
                    </span>
                    {note.priority && <PriorityBadge priority={note.priority} />}
                  </button>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
