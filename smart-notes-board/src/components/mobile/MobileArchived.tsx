import { useMemo } from "react";
import { ArchiveRestore, ChevronRight, Inbox } from "lucide-react";
import { emptyFilters, matchesFilters } from "@/lib/board/filters";
import { boardActions } from "@/stores/board";
import { toastUndo } from "@/lib/toast";
import { formatDate } from "@/lib/date";
import { noteBg } from "@/components/note/note-style";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/board/model";

/**
 * As notas arquivadas.
 *
 * Ficam fora da agenda de tarefas de propósito: arquivar é justamente tirar da
 * frente. Aqui elas voltam a ser alcançáveis, com o desarquivar à mão — que é
 * quase sempre o motivo de alguém abrir esta tela.
 */
export function MobileArchived({
  notes,
  query,
  onOpenNote,
}: {
  notes: Note[];
  query: string;
  onOpenNote: (id: string) => void;
}) {
  const archived = useMemo(
    () =>
      notes
        .filter(
          (note) =>
            note.archived &&
            matchesFilters(note, { ...emptyFilters, query }, { archivedOnly: true }),
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes, query],
  );

  if (archived.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 pb-28 text-center">
        <Inbox className="h-7 w-7 text-muted-foreground" />
        <p className="text-base font-semibold">
          {query ? "Nenhuma arquivada encontrada" : "Nenhuma nota arquivada"}
        </p>
        {!query && (
          <p className="text-sm text-muted-foreground">
            Arquivar tira a nota da agenda sem apagá-la. As arquivadas aparecem aqui.
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-28">
      {archived.map((note) => (
        <li key={note.id} className="flex items-stretch gap-3 px-4">
          <button
            onClick={() => {
              boardActions.setNoteArchived(note.id, false);
              toastUndo(`"${note.title || "Nota"}" desarquivada`, () =>
                boardActions.setNoteArchived(note.id, true),
              );
            }}
            aria-label={`Desarquivar ${note.title || "nota"}`}
            title="Desarquivar"
            className="flex shrink-0 items-center py-3 text-muted-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
              <ArchiveRestore className="h-4 w-4" />
            </span>
          </button>

          <button
            onClick={() => onOpenNote(note.id)}
            className="flex min-w-0 flex-1 items-center gap-2 border-b border-border/70 py-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] leading-snug text-muted-foreground">
                {note.title || "Sem título"}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", noteBg[note.color])} />
                <span className="tabular-nums">{formatDate(note.updatedAt)}</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          </button>
        </li>
      ))}
    </ul>
  );
}
