import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { noteBg } from "@/components/note/note-style";
import { NoteRichContent } from "@/components/note/NoteRichContent";
import { DeadlineBadge, PriorityBadge } from "@/components/note/NoteMeta";
import type { Note } from "@/lib/board/model";

/** Espiada rápida na nota sem sair do calendário. */
export function NotePreviewDialog({
  note,
  onClose,
  onOpenDetails,
}: {
  note: Note;
  onClose: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border/60 p-6 shadow-2xl",
          noteBg[note.color],
        )}
      >
        <button
          onClick={onClose}
          aria-label="Fechar visualização"
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="pr-8 text-xl font-bold leading-snug">{note.title || "Sem título"}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {note.priority && <PriorityBadge priority={note.priority} />}
          {note.deadline && <DeadlineBadge deadline={note.deadline} />}
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px]"
            >
              {tag}
            </span>
          ))}
        </div>

        <NoteRichContent
          html={note.content}
          className="prose-sm mt-4 text-sm leading-relaxed [&_img]:my-2 [&_img]:max-h-64 [&_img]:rounded-md"
        />

        {note.checklist.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {note.checklist.map((item) => (
              <li key={item.id} className={cn(item.done && "text-muted-foreground line-through")}>
                {item.done ? "☑" : "☐"} {item.text}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onOpenDetails}
          className="mt-5 rounded-md border border-foreground/20 bg-background/70 px-3 py-1.5 text-xs font-medium hover:bg-background"
        >
          Abrir detalhes
        </button>
      </div>
    </div>
  );
}
