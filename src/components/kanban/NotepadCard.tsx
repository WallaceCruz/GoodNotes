import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Archive, ArchiveRestore, GripVertical, Maximize2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { BoardStore } from "@/hooks/useBoardStore";
import type { Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { AssigneeSelect } from "./AssigneeSelect";
import { ChecklistEditor } from "./ChecklistEditor";

import { DeadlineBadge, PriorityBadge } from "./NoteMeta";
import { RichNoteEditor } from "./RichNoteEditor";
import { TagEditor } from "./TagEditor";

export function NotepadCard({
  note,
  active,
  store,
  onOpen,
}: {
  note: Note;
  active: boolean;
  store: BoardStore;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    transition: { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  });
  const onChange = (patch: Partial<Note>) => store.updateNote(note.id, patch);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 30 : undefined,
      }}
      className={cn(
        "group flex min-h-[22rem] flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_-6px_rgba(0,0,0,0.10)] transition-shadow duration-200 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05),0_10px_24px_-10px_rgba(0,0,0,0.16)]",
        isDragging && "scale-[0.98] opacity-40 shadow-none ring-2 ring-dashed ring-ring/40",
        note.archived && "opacity-60 grayscale",
        active && "ring-2 ring-ring",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center gap-1.5 border-b border-border/70 bg-card px-2 py-1.5 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5 text-foreground/40" />
        <div className="ml-auto flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
          <button
            aria-label="Abrir detalhes"
            onClick={onOpen}
            className="opacity-0 group-hover:opacity-100"
          >
            <Maximize2 className="h-3.5 w-3.5 text-foreground/50" />
          </button>
          <button
            aria-label={note.archived ? "Restaurar bloco" : "Arquivar bloco"}
            onClick={() => store.setNoteArchived(note.id, !note.archived)}
            className="opacity-0 group-hover:opacity-100"
          >
            {note.archived ? (
              <ArchiveRestore className="h-3.5 w-3.5 text-foreground/50" />
            ) : (
              <Archive className="h-3.5 w-3.5 text-foreground/50" />
            )}
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button aria-label="Excluir bloco" className="opacity-0 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5 text-foreground/50" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir "{note.title || "Bloco de notas"}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  O bloco será removido do quadro. Você poderá desfazer logo em seguida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    store.removeNote(note.id);
                    toast.success(`"${note.title || "Bloco de notas"}" excluído`, {
                      action: { label: "Desfazer", onClick: () => store.restoreNote(note) },
                    });
                  }}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 bg-card px-3 pb-2 pt-2">
        {(note.priority || note.deadline) && (
          <div className="flex flex-wrap items-center gap-1 pb-1">
            {note.priority && <PriorityBadge priority={note.priority} />}
            {note.deadline && <DeadlineBadge deadline={note.deadline} />}
          </div>
        )}

        <input
          value={note.title}
          onChange={(e) => onChange({ title: e.target.value })}
          aria-label="Título do bloco"
          className="w-full bg-transparent text-[15px] font-bold leading-7 text-foreground outline-none"
        />

        <RichNoteEditor
          content={note.content}
          onChange={(html) => onChange({ content: html })}
          minHeight="min-h-40"
          compact
          checklistActive={note.showChecklist}
          onToggleChecklist={() => onChange({ showChecklist: !note.showChecklist })}
        />

        {note.showChecklist && (
          <div className="mt-2">
            <ChecklistEditor
              items={note.checklist}
              onAdd={(text) => store.addChecklistItem(note.id, text)}
              onUpdate={(id, patch) => store.updateChecklistItem(note.id, id, patch)}
              onRemove={(id) => store.removeChecklistItem(note.id, id)}
            />
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <AssigneeSelect value={note.assignee} onChange={(assignee) => onChange({ assignee })} />
        <div className="min-w-0 flex-1">
          <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} store={store} />
        </div>
      </footer>
    </div>
  );
}
