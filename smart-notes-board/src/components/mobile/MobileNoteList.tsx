import { useMemo, useState } from "react";
import { Check, ChevronRight, Paperclip, Search, X } from "lucide-react";
import { agendaGroups } from "@/lib/board/agenda";
import { isNoteDone } from "@/lib/board/status";
import { emptyFilters, matchesFilters } from "@/lib/board/filters";
import { boardActions } from "@/stores/board";
import { toastUndo } from "@/lib/toast";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { noteBg } from "@/components/note/note-style";
import { PRIORITY_LABEL, type Column, type Note } from "@/lib/board/model";

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-prio-urgent",
  high: "bg-prio-high",
  medium: "bg-prio-medium",
  low: "bg-prio-low",
};

/** Uma tarefa: concluir sem sair da lista, ou tocar para abrir a nota. */
function TaskRow({ note, columns, onOpen }: { note: Note; columns: Column[]; onOpen: () => void }) {
  const done = isNoteDone(note, columns);

  const toggle = () => {
    boardActions.setNoteDone(note.id, !done);
    if (!done) {
      toastUndo(`"${note.title || "Nota"}" concluída`, () =>
        boardActions.setNoteDone(note.id, false),
      );
    }
  };

  return (
    <li className="flex items-stretch gap-3 px-4">
      {/* Alvo largo: concluir é a ação mais frequente e tem que caber no polegar. */}
      <button
        onClick={toggle}
        aria-label={done ? `Reabrir ${note.title}` : `Concluir ${note.title}`}
        aria-pressed={done}
        className="flex shrink-0 items-center py-3"
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-2 transition",
            done ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25",
          )}
        >
          {done && <Check className="h-3.5 w-3.5" />}
        </span>
      </button>

      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 border-b border-border/70 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "flex items-center gap-1.5 text-[15px] leading-snug",
              done ? "text-muted-foreground line-through" : "text-foreground",
            )}
          >
            {note.priority && !done && (
              <span
                aria-label={PRIORITY_LABEL[note.priority]}
                title={PRIORITY_LABEL[note.priority]}
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[note.priority])}
              />
            )}
            <span className="truncate">{note.title || "Sem título"}</span>
          </span>

          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", noteBg[note.color])} />
            {note.deadline && <span className="tabular-nums">{formatDate(note.deadline)}</span>}
            {note.tags[0] && <span className="truncate">#{note.tags[0]}</span>}
            {note.attachments.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip className="h-2.5 w-2.5" />
                {note.attachments.length}
              </span>
            )}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      </button>
    </li>
  );
}

/**
 * As notas como um app de tarefas as mostra: seções por prazo, linhas achatadas
 * e a conclusão a um toque. O cartão colorido do quadro não cabe aqui — numa
 * tela estreita o que se quer é varrer muitos títulos, não admirar um.
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

  const groups = useMemo(() => {
    const visible = notes.filter((note) => matchesFilters(note, { ...emptyFilters, query }));
    return agendaGroups(visible, columns);
  }, [notes, columns, query]);

  const total = groups.reduce((soma, grupo) => soma + grupo.notes.length, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pb-2">
        <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nas notas"
            aria-label="Buscar nas notas"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Limpar busca">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-28">
        {total === 0 && (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            {query ? "Nenhuma nota encontrada." : "Nada por aqui ainda."}
          </p>
        )}

        {groups.map((group) => (
          <section key={group.key}>
            <h2
              className={cn(
                "sticky top-0 z-10 flex items-center gap-2 bg-background/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur",
                group.urgent ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {group.label}
              <span className="font-normal text-muted-foreground">{group.notes.length}</span>
            </h2>
            <ul>
              {group.notes.map((note) => (
                <TaskRow
                  key={note.id}
                  note={note}
                  columns={columns}
                  onOpen={() => onOpenNote(note.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
