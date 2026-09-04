import { CheckCircle2, Pin } from "lucide-react";
import {
  effectiveStatus,
  initials,
  noteAssignees,
  type Column,
  type Note,
} from "@/lib/board-types";
import { useActiveProjectId } from "@/stores/board";
import { useNoteAppearance } from "@/stores/noteAppearance";
import { cn } from "@/lib/utils";
import { noteSurface } from "../kanban/note-appearance";
import { noteBg } from "../kanban/note-style";
import { NoteRichContent } from "../kanban/NoteRichContent";
import { CategoryBadge } from "../kanban/CategorySelect";
import { DeadlineBadge, PriorityBadge } from "../kanban/NoteMeta";
import { StatusBadge } from "../kanban/StatusSelect";

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

  const status = effectiveStatus(note, columns);
  const column = columns.find((c) => c.id === note.columnId);
  const assignees = noteAssignees(note);
  const doneItems = note.checklist.filter((item) => item.done).length;
  const checklistPercent =
    note.checklist.length === 0 ? 0 : Math.round((doneItems / note.checklist.length) * 100);

  return (
    <article
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-3xl border-border/60 p-5 text-note-foreground shadow-xl",
        appearance.style === "classic" &&
          !appearance.bgColor &&
          !note.colorHex &&
          noteBg[note.color],
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
        {status && <StatusBadge status={status} />}
        {note.category && <CategoryBadge category={note.category} />}
        {note.priority && <PriorityBadge priority={note.priority} />}
        {note.deadline && <DeadlineBadge deadline={note.deadline} />}
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
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-foreground/60">
              <span>Checklist</span>
              <span>
                {doneItems}/{note.checklist.length}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {note.checklist.slice(0, 4).map((item) => (
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
              {note.checklist.length > 4 && (
                <li className="text-xs text-foreground/50">
                  +{note.checklist.length - 4} item(ns)
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-3">
        {assignees.slice(0, 3).map((name, i) => (
          <span
            key={name}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border border-background bg-primary text-[11px] font-semibold text-primary-foreground",
              i > 0 && "-ml-3",
            )}
          >
            {initials(name)}
          </span>
        ))}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-foreground/15 px-2 py-0.5 text-[11px] text-foreground/70"
            >
              #{tag}
            </span>
          ))}
        </div>
      </footer>
    </article>
  );
}
