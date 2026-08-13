import { useDroppable } from "@dnd-kit/core";
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
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, MoreHorizontal, NotebookPen, Plus, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { BoardStore } from "@/hooks/useBoardStore";
import { NOTE_COLORS, type Column, type Note, type NoteKind } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "./note-style";
import { NotepadCard } from "./NotepadCard";
import { StickyNoteCard } from "./StickyNoteCard";

export function KanbanColumn({
  column,
  notes,
  activeNoteId,
  store,
  onAddNote,
  onOpenNote,
  highlightIds,
}: {
  column: Column;
  notes: Note[];
  activeNoteId: string | null;
  store: BoardStore;
  onAddNote: (kind: NoteKind) => void;
  onOpenNote: (id: string) => void;
  highlightIds?: Set<string> | undefined;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex max-h-full w-96 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card/70 backdrop-blur-sm">
      <div className={cn("h-1.5 w-full", column.color ? noteBg[column.color] : "bg-transparent")} />
      <div
        className={cn(
          "flex items-center gap-1 border-b border-border px-3 py-2",
          column.color && `${noteBg[column.color]}/40`,
        )}
      >
        <input
          value={column.title}
          onChange={(e) => store.renameColumn(column.id, e.target.value)}
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
        <span className="rounded bg-muted px-1.5 text-[11px] text-muted-foreground">
          {notes.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Adicionar item" className="text-muted-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => onAddNote("sticky")}>
              <StickyNote className="mr-2 h-4 w-4" />
              Nota autoadesiva
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddNote("notepad")}>
              <NotebookPen className="mr-2 h-4 w-4" />
              Bloco de notas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Mais opções da coluna" className="text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-2 py-1.5">
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">Cor da coluna</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    title="Sem cor"
                    onClick={() => store.setColumnColor(column.id, null)}
                    className={cn(
                      "h-5 w-5 rounded-full border border-border bg-background",
                      !column.color && "ring-2 ring-ring ring-offset-1 ring-offset-background",
                    )}
                  />
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      title={noteLabel[c]}
                      onClick={() => store.setColumnColor(column.id, c)}
                      className={cn(
                        "h-5 w-5 rounded-full border border-border",
                        noteBg[c],
                        column.color === c && "ring-2 ring-ring ring-offset-1 ring-offset-background",
                      )}
                    />
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  store.duplicateColumn(column.id);
                  toast.success(`Coluna "${column.title}" duplicada`);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicar coluna
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir coluna
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir coluna "{column.title}"?</AlertDialogTitle>
              <AlertDialogDescription>
                {notes.length
                  ? `${notes.length} nota(s) desta coluna também serão removidas.`
                  : "Esta ação removerá a coluna do quadro."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const removedNotes = notes;
                  store.removeColumn(column.id);
                  toast.success(`Coluna "${column.title}" excluída`, {
                    description: removedNotes.length
                      ? `${removedNotes.length} nota(s) removida(s) junto.`
                      : undefined,
                    action: {
                      label: "Desfazer",
                      onClick: () => store.restoreColumn(column, removedNotes),
                    },
                  });
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>


      <div
        ref={setNodeRef}
        className={`scroll-thin flex min-h-32 flex-1 flex-col gap-3 overflow-y-auto rounded-b-lg p-2 transition-colors ${
          isOver ? "bg-accent/60 ring-2 ring-inset ring-ring/50" : ""
        }`}
      >
        <SortableContext items={notes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          {notes.map((n) => {
            const Card = n.kind === "notepad" ? NotepadCard : StickyNoteCard;
            return (
              <div
                key={n.id}
                className={
                  highlightIds?.has(n.id)
                    ? "rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : undefined
                }
              >
                <Card
                  note={n}
                  store={store}
                  active={activeNoteId === n.id}
                  onOpen={() => onOpenNote(n.id)}
                />
              </div>
            );
          })}
        </SortableContext>
        {isOver && (
          <div className="h-16 shrink-0 rounded-lg border-2 border-dashed border-ring/60 bg-background/40" />
        )}
      </div>
    </div>
  );
}
