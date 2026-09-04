import { AlertTriangle } from "lucide-react";
import { formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "@/components/note/note-style";
import type { Note } from "@/lib/board/model";

/**
 * Nota arrastável dentro da grade.
 *
 * O mesmo bloco aparecia escrito três vezes (mês, semana/dia e barra lateral)
 * com diferenças só de `title`; qualquer ajuste de estilo tinha que ser feito
 * nos três. Agora é um componente com uma variação de rótulo.
 */
export function CalendarNoteChip({
  note,
  conflicting,
  onDragStart,
  onSelect,
}: {
  note: Note;
  conflicting: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onSelect: () => void;
}) {
  const time = note.deadline ? formatTime(note.deadline) : "";
  const title = conflicting
    ? `Conflito: outra nota vence no mesmo horário (${time})`
    : note.deadline
      ? `${time} · ${note.title}`
      : noteLabel[note.color];

  return (
    <div
      draggable
      title={title}
      onDragStart={onDragStart}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={cn(
        "cursor-grab truncate rounded border border-border/60 px-1 py-0.5 text-[10px] text-foreground active:cursor-grabbing",
        noteBg[note.color],
        conflicting && "border-destructive ring-1 ring-destructive",
      )}
    >
      {conflicting && <AlertTriangle className="mr-0.5 inline h-2.5 w-2.5 text-destructive" />}
      {note.deadline && <span className="font-medium tabular-nums">{time}</span>}{" "}
      {note.title || "Sem título"}
    </div>
  );
}
