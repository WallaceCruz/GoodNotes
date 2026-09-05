import { CheckCircle2, MessageSquare, Pin } from "lucide-react";
import { type Column, type Note } from "@/lib/board/model";
import { noteAssignees } from "@/lib/board/notes";
import { useActiveProjectId, useFileTags } from "@/stores/board";
import { useNoteAppearance } from "@/stores/note-appearance";
import { cn } from "@/lib/utils";
import { noteSurface } from "@/components/note/note-appearance";
import { AssigneeStack, ChecklistBar, NoteBadges, TagChips } from "@/components/note/note-parts";
import { NoteRichContent } from "@/components/note/NoteRichContent";

/** Quantos itens do checklist a carta lista antes de resumir o resto. */
const CHECKLIST_PREVIEW = 4;

/**
 * A nota como carta do baralho.
 *
 * Diferente do card do quadro, aqui nada é editável: no celular a carta é para
 * ler e decidir, e qualquer campo editável no meio de uma área que responde a
 * arraste viraria toque acidental. Editar é um passo explícito, na tela de
 * detalhe.
 */
export function DeckCard({ note, columns }: { note: Note; columns: Column[] }) {
  const activeProjectId = useActiveProjectId();
  const { appearance } = useNoteAppearance(activeProjectId);
  const surface = noteSurface(appearance, note.color, {
    tilt: false,
    tint: note.colorHex ?? null,
  });

  const fileTags = useFileTags();
  const column = columns.find((c) => c.id === note.columnId);
  const assignees = noteAssignees(note);

  return (
    <article
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-3xl border-border/60 p-5 text-note-foreground shadow-xl",
        surface.className,
      )}
      style={surface.style}
    >
      <header className="flex flex-wrap items-center gap-1.5">
        {column && (
          <span className="rounded-full border border-foreground/15 bg-background/40 px-2 py-0.5 text-[11px] font-medium">
            {column.title}
          </span>
        )}
        <NoteBadges note={note} columns={columns} />
        {note.pinned && <Pin className="ml-auto h-4 w-4 text-foreground/60" />}
      </header>

      <h2 className="note-title-color mt-3 text-2xl font-bold leading-tight">
        {note.title || "Sem título"}
      </h2>

      {/* O corpo rola dentro da carta; o gesto do deck é horizontal e não conflita. */}
      <div className="scroll-thin mt-2 min-h-0 flex-1 overflow-y-auto">
        <NoteRichContent html={note.content} className="note-prose text-[15px] leading-relaxed" />

        {note.checklist.length > 0 && (
          <div className="mt-4">
            <ChecklistBar items={note.checklist} />
            <ul className="mt-2 space-y-1 text-sm">
              {note.checklist.slice(0, CHECKLIST_PREVIEW).map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      item.done ? "text-emerald-600" : "text-foreground/25",
                    )}
                  />
                  <span className={cn(item.done && "text-foreground/50 line-through")}>
                    {item.text}
                  </span>
                </li>
              ))}
              {note.checklist.length > CHECKLIST_PREVIEW && (
                <li className="text-xs text-foreground/50">
                  +{note.checklist.length - CHECKLIST_PREVIEW} item(ns)
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-3">
        <AssigneeStack names={assignees} size="md" max={3} />
        <TagChips tags={note.tags} tagDefs={fileTags} max={3} className="flex-1" />
        {/* Só a contagem: o card responde a deslizar, e um controle aqui
            disputaria o gesto. Para ler e responder, abra a nota. */}
        {note.comments.length > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-foreground/60">
            <MessageSquare className="h-3 w-3" />
            {note.comments.length}
          </span>
        )}
      </footer>
    </article>
  );
}
