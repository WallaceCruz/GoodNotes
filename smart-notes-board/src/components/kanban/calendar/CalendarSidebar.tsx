import { AlertTriangle, Plus } from "lucide-react";
import { dateFromDayKey, formatTime } from "@/lib/date";
import { stripHtml } from "@/lib/html";
import { hasConflict } from "@/lib/board/calendar";
import { cn } from "@/lib/utils";
import { noteBg } from "@/components/note/note-style";
import { DeadlineBadge, PriorityBadge } from "@/components/note/NoteMeta";
import type { Note } from "@/lib/board/model";

/** Quantas notas sem prazo a lista mostra antes de virar rolagem infinita inútil. */
const MAX_WITHOUT_DEADLINE = 20;

const longDate = (key: string) =>
  dateFromDayKey(key).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

/** Painel lateral: o que vence no dia escolhido e o que ainda não tem prazo. */
export function CalendarSidebar({
  selectedKey,
  notesOfDay,
  withoutDeadline,
  conflicts,
  onCreateNote,
  onDragStartNote,
  onPreviewNote,
}: {
  selectedKey: string;
  notesOfDay: Note[];
  withoutDeadline: Note[];
  conflicts: Set<number>;
  onCreateNote: () => void;
  onDragStartNote: (noteId: string) => (event: React.DragEvent) => void;
  onPreviewNote: (noteId: string) => void;
}) {
  return (
    <aside className="scroll-thin w-80 shrink-0 overflow-y-auto border-l border-border p-4">
      <h3 className="text-sm font-semibold capitalize">{longDate(selectedKey)}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {notesOfDay.length} nota(s) com prazo neste dia
      </p>

      <button
        onClick={onCreateNote}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-accent"
      >
        <Plus className="h-3.5 w-3.5" />
        Criar nota para este dia
      </button>

      <div className="mt-3 space-y-2">
        {notesOfDay.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum prazo para este dia.</p>
        )}

        {notesOfDay.map((note) => {
          const conflicting = hasConflict(note, conflicts);
          return (
            <button
              key={note.id}
              draggable
              onDragStart={onDragStartNote(note.id)}
              onClick={() => onPreviewNote(note.id)}
              className={cn(
                "block w-full rounded-md border border-border/60 p-2 text-left transition-shadow hover:shadow-md",
                noteBg[note.color],
                conflicting && "border-destructive ring-1 ring-destructive",
              )}
            >
              <p className="text-sm font-medium leading-snug">
                <span className="mr-1 tabular-nums text-muted-foreground">
                  {formatTime(note.deadline!)}
                </span>
                {note.title || "Sem título"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {note.priority && <PriorityBadge priority={note.priority} />}
                {note.deadline && <DeadlineBadge deadline={note.deadline} />}
                {conflicting && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-destructive/50 bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Conflito de horário
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {stripHtml(note.content)}
              </p>
            </button>
          );
        })}
      </div>

      {withoutDeadline.length > 0 && (
        <>
          <h4 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sem prazo ({withoutDeadline.length}) — arraste para um dia
          </h4>
          <div className="mt-2 space-y-1">
            {withoutDeadline.slice(0, MAX_WITHOUT_DEADLINE).map((note) => (
              <button
                key={note.id}
                draggable
                onDragStart={onDragStartNote(note.id)}
                onClick={() => onPreviewNote(note.id)}
                className={cn(
                  "block w-full cursor-grab truncate rounded-md border border-border/60 px-2 py-1.5 text-left text-xs text-foreground hover:shadow-md active:cursor-grabbing",
                  noteBg[note.color],
                )}
              >
                {note.title || "Sem título"}
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
