import { Archive, ArchiveRestore, ListChecks, X } from "lucide-react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { NOTE_COLORS, type Note } from "@/lib/board-types";
import { AssigneeSelect } from "./AssigneeSelect";
import { ChecklistEditor } from "./ChecklistEditor";
import { NoteImageStrip } from "./NoteImageStrip";
import { PriorityDeadlineControls } from "./NoteMeta";
import { RichNoteEditor } from "./RichNoteEditor";
import { TagEditor } from "./TagEditor";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "./note-style";

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
        <span className="text-sm font-semibold">Nota</span>
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
        <div className={cn("rounded-md border border-border/60 p-3 shadow-sm", noteBg[note.color])}>
          <input
            value={note.title}
            onChange={(e) => onChange({ title: e.target.value })}
            aria-label="Título da nota"
            className="w-full bg-transparent text-base font-bold outline-none"
          />

          <RichNoteEditor
            content={note.content}
            onChange={(html) => onChange({ content: html })}
            minHeight="min-h-32"
          />

          <div className="mt-2">
            <NoteImageStrip
              images={note.images}
              onAdd={(url, link) => store.addImage(note.id, url, link)}
              onUpdate={(id, patch) => store.updateImage(note.id, id, patch)}
              onRemove={(id) => store.removeImage(note.id, id)}
            />
          </div>

          {note.showChecklist || note.checklist.length > 0 ? (
            <div className="mt-3">
              <ChecklistEditor
                items={note.checklist}
                onAdd={(text) => store.addChecklistItem(note.id, text)}
                onUpdate={(id, patch) => store.updateChecklistItem(note.id, id, patch)}
                onRemove={(id) => store.removeChecklistItem(note.id, id)}
              />
            </div>
          ) : (
            <button
              onClick={() => onChange({ showChecklist: true })}
              className="mt-3 flex items-center gap-1 rounded-md border border-dashed border-foreground/25 px-1.5 py-0.5 text-[10px] text-foreground/60 hover:bg-foreground/5"
            >
              <ListChecks className="h-3 w-3" />
              Adicionar checklist
            </button>
          )}

          <div className="mt-3">
            <PriorityDeadlineControls note={note} onChange={onChange} />
          </div>

          <footer className="mt-3 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-2">
            <AssigneeSelect
              value={note.assignee}
              onChange={(assignee) => onChange({ assignee })}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} />
            </div>
          </footer>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cor da nota
          </p>
          <div className="mt-2 flex gap-2">
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
      </div>
    </section>
  );
}
