import { Archive, ArchiveRestore, X } from "lucide-react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { noteAssignees, NOTE_COLORS, PRIORITIES, PRIORITY_ICON, PRIORITY_LABEL, type Note } from "@/lib/board-types";
import { AssigneeSelect } from "./AssigneeSelect";
import { DeadlinePicker } from "./DeadlinePicker";
import { TagEditor } from "./TagEditor";
import { StatusSelect } from "./StatusSelect";
import { CategorySelect } from "./CategorySelect";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel, priorityClass } from "./note-style";

export function NoteEditorPanel({
  note,
  store,
  onClose,
}: {
  note: Note;
  store: BoardStore;
  onClose: () => void;
}) {
  const onChange = (patch: Partial<Note>) => store.updateNote(note.id, patch);

  return (
    <section className="flex w-[26rem] shrink-0 flex-col border-l border-border bg-background">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-semibold">
          {note.kind === "notepad" ? "Bloco de notas" : "Nota"}
        </span>
        <button
          onClick={() => store.setNoteArchived(note.id, !note.archived)}
          aria-label={note.archived ? "Restaurar nota" : "Arquivar nota"}
          className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
        >
          {note.archived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          {note.archived ? "Restaurar" : "Arquivar"}
        </button>
        <button onClick={onClose} aria-label="Fechar nota" className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto p-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Responsáveis
          </p>
          <div className="mt-2">
            <AssigneeSelect
              value={noteAssignees(note)}
              onChange={(names) => onChange({ assignees: names, assignee: names[0] ?? null })}
              size="md"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Etiquetas
          </p>
          <div className="mt-2">
            <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} store={store} size="md" />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </p>
          <div className="mt-2">
            <StatusSelect value={note.status} onChange={(status) => onChange({ status })} />
          </div>
        </div>

        {note.kind !== "notepad" && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Categoria
            </p>
            <div className="mt-2">
              <CategorySelect value={note.category} onChange={(category) => onChange({ category })} />
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Prioridade
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => onChange({ priority: note.priority === p ? null : p })}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  note.priority === p
                    ? priorityClass[p]
                    : "border-border bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Prazo de conclusão
          </p>
          <div className="mt-2">
            <DeadlinePicker
              value={note.deadline}
              onChange={(deadline) => onChange({ deadline })}
            />
          </div>
        </div>

        {note.kind !== "notepad" && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cor da nota
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={noteLabel[c]}
                  onClick={() => onChange({ color: c })}
                  className={cn(
                    "h-6 w-6 rounded-full border border-border",
                    noteBg[c],
                    note.color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
