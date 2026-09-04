import { Search, X } from "lucide-react";
import { useState } from "react";
import { type Column, type Note } from "@/lib/board/model";
import { isNoteDone } from "@/lib/board/status";
import { matchesFilters, emptyFilters } from "@/lib/board/filters";
import { cn } from "@/lib/utils";
import { stripHtml } from "@/lib/html";
import { noteBg } from "@/components/note/note-style";
import { DeadlineBadge, PriorityBadge } from "@/components/note/NoteMeta";

/**
 * A lista é o complemento do deck: pilha é ótima para percorrer em ordem, mas
 * péssima para achar uma nota específica. Aqui a busca faz esse papel.
 */
export function MobileNoteList({
  notes,
  columns,
  onOpenNote,
}: {
  notes: Note[];
  columns: Column[];
  onOpenNote: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = notes.filter((note) => matchesFilters(note, { ...emptyFilters, query }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pb-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nas notas"
            aria-label="Buscar nas notas"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma nota encontrada.
          </p>
        )}

        {visible.map((note) => {
          const done = isNoteDone(note, columns);
          const column = columns.find((c) => c.id === note.columnId);
          return (
            <button
              key={note.id}
              onClick={() => onOpenNote(note.id)}
              className={cn(
                "flex w-full flex-col gap-1 rounded-xl border border-border/60 p-3 text-left",
                noteBg[note.color],
                done && "opacity-60",
              )}
            >
              <div className="flex items-center gap-1.5">
                {column && (
                  <span className="rounded-full border border-foreground/15 bg-background/40 px-1.5 py-0.5 text-[10px]">
                    {column.title}
                  </span>
                )}
                {note.priority && <PriorityBadge priority={note.priority} />}
                {note.deadline && <DeadlineBadge deadline={note.deadline} />}
              </div>
              <p className={cn("font-semibold leading-snug", done && "line-through")}>
                {note.title || "Sem título"}
              </p>
              <p className="line-clamp-2 text-xs text-foreground/60">{stripHtml(note.content)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
