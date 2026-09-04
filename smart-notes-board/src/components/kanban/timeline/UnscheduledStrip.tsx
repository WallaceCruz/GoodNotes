import { cn } from "@/lib/utils";
import { noteBg } from "@/components/note/note-style";
import type { Note } from "@/lib/board/model";

/**
 * Faixa das notas sem data. Elas ficam à vista, e não escondidas numa lista,
 * porque a forma de agendá-las é justamente arrastá-las daqui para a grade.
 */
export function UnscheduledStrip({
  notes,
  onStartDrag,
  onOpenNote,
}: {
  notes: Note[];
  onStartDrag: (event: React.PointerEvent, note: Note) => void;
  onOpenNote: (id: string) => void;
}) {
  if (notes.length === 0) return null;

  return (
    <div className="flex items-start gap-2 border-b border-border bg-muted/30 px-4 py-2">
      <span className="mt-1 shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Sem prazo
      </span>
      <div className="flex flex-wrap gap-1.5">
        {notes.map((note) => (
          <button
            key={note.id}
            onPointerDown={(event) => onStartDrag(event, note)}
            onDoubleClick={() => onOpenNote(note.id)}
            title="Arraste para a grade para agendar"
            className={cn(
              "max-w-56 truncate rounded-full border border-border px-2 py-1 text-[11px]",
              noteBg[note.color],
            )}
          >
            {note.title || "Sem título"}
          </button>
        ))}
      </div>
    </div>
  );
}
