import { Archive, ArchiveRestore, ArrowLeft, Trash2 } from "lucide-react";
import { toastUndo } from "@/lib/toast";
import { PRIORITIES, PRIORITY_ICON, PRIORITY_LABEL } from "@/lib/board/model";
import { noteAssignees } from "@/lib/board/notes";
import { boardActions, useFileColumns } from "@/stores/board";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/date";
import { priorityClass } from "@/components/note/note-style";
import { AssigneeSelect } from "@/components/note/AssigneeSelect";
import { CategorySelect } from "@/components/note/CategorySelect";
import { ChecklistEditor } from "@/components/note/ChecklistEditor";
import { DeadlinePicker } from "@/components/note/DeadlinePicker";
import { RichNoteEditor } from "@/components/editor/RichNoteEditor";
import { PrioritySelect } from "@/components/note/PrioritySelect";
import { StatusSelect } from "@/components/note/StatusSelect";
import { TagEditor } from "@/components/note/TagEditor";
import { NoteComments } from "@/components/note/NoteComments";
import { NoteAttachments } from "@/components/note/NoteAttachments";
import { NoteDates } from "@/components/note/NoteDates";
import type { Note } from "@/lib/board/model";

/** O rótulo é opcional: alguns editores já trazem o próprio cabeçalho. */
function Field({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-4 py-4">
      {label && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      {children}
    </section>
  );
}

/**
 * A nota inteira, ocupando a tela.
 *
 * No desktop o mesmo trabalho é feito por um card centralizado com um painel de
 * 22rem ao lado — o que num celular não caberia. Aqui o conteúdo vem primeiro e
 * os metadados descem em seções empilhadas, todas com alvos de toque grandes.
 */
export function MobileNoteScreen({ note, onClose }: { note: Note; onClose: () => void }) {
  const columns = useFileColumns();
  const onChange = (patch: Partial<Note>) => boardActions.updateNote(note.id, patch);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-2 py-2">
        <button
          onClick={onClose}
          aria-label="Voltar para o deck"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-xs text-muted-foreground">Editado {timeAgo(note.updatedAt)}</span>

        <button
          onClick={() => boardActions.setNoteArchived(note.id, !note.archived)}
          aria-label={note.archived ? "Restaurar nota" : "Arquivar nota"}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
        >
          {note.archived ? (
            <ArchiveRestore className="h-[18px] w-[18px]" />
          ) : (
            <Archive className="h-[18px] w-[18px]" />
          )}
        </button>
        <button
          onClick={() => {
            const removed = note;
            boardActions.removeNote(note.id);
            onClose();
            toastUndo(`"${note.title || "Nota"}" excluída`, () =>
              boardActions.restoreNote(removed),
            );
          }}
          aria-label="Excluir nota"
          className="flex h-10 w-10 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </header>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-8">
        <div className="px-4 py-4">
          <input
            value={note.title}
            onChange={(e) => onChange({ title: e.target.value })}
            aria-label="Título da nota"
            placeholder="Sem título"
            className="w-full bg-transparent text-2xl font-bold leading-tight outline-none placeholder:text-foreground/30"
          />
          <div className="mt-3">
            <RichNoteEditor
              content={note.content}
              onChange={(html) => onChange({ content: html })}
              minHeight="min-h-40"
            />
          </div>
        </div>

        <Field>
          <ChecklistEditor
            items={note.checklist}
            onAdd={(text) => boardActions.addChecklistItem(note.id, text)}
            onUpdate={(id, patch) => boardActions.updateChecklistItem(note.id, id, patch)}
            onRemove={(id) => boardActions.removeChecklistItem(note.id, id)}
          />
        </Field>

        <Field label="Coluna">
          <div className="flex flex-wrap gap-1.5">
            {columns.map((column) => (
              <button
                key={column.id}
                onClick={() => boardActions.moveNote(note.id, column.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  note.columnId === column.id
                    ? "border-primary bg-primary/10 font-medium text-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {column.title}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Status">
          <StatusSelect value={note.status} onChange={(status) => onChange({ status })} />
        </Field>

        <Field label="Prioridade">
          <PrioritySelect
            size="lg"
            value={note.priority}
            onChange={(priority) => onChange({ priority })}
          />
        </Field>

        <Field label="Prazo de conclusão">
          <DeadlinePicker value={note.deadline} onChange={(deadline) => onChange({ deadline })} />
        </Field>

        <Field label="Etiquetas">
          <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} size="md" />
        </Field>

        <Field label="Comentários">
          <NoteComments noteId={note.id} comments={note.comments} />
        </Field>

        <Field label="Anexos">
          <NoteAttachments noteId={note.id} attachments={note.attachments} />
        </Field>

        <Field label="Responsáveis">
          <AssigneeSelect
            value={noteAssignees(note)}
            onChange={(names) => onChange({ assignees: names, assignee: names[0] ?? null })}
            size="md"
            variant="cta"
          />
        </Field>

        <Field label="Categoria">
          <CategorySelect value={note.category} onChange={(category) => onChange({ category })} />
        </Field>

        <NoteDates
          createdAt={note.createdAt}
          updatedAt={note.updatedAt}
          className="justify-center pb-2 pt-1"
        />
      </div>
    </div>
  );
}
