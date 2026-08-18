import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BoardStore } from "@/hooks/useBoardStore";
import type { Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";

/** Menu de "mais opções" (três pontos) das notas e blocos. */
export function NoteOptionsMenu({
  note,
  store,
  onOpen,
}: {
  note: Note;
  store: BoardStore;
  onOpen: () => void;
}) {
  const label = note.kind === "notepad" ? "Bloco de notas" : "Nota";
  const title = note.title || label;

  return (
    <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Mais opções"
            title="Mais opções"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded text-foreground/60 opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground",
              "group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={onOpen}>
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => store.setNotePinned(note.id, !note.pinned)}>
            {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {note.pinned ? "Desafixar" : "Fixar no topo"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              store.duplicateNote(note.id);
              toast.success(`${label} duplicad${note.kind === "notepad" ? "o" : "a"}`);
            }}
          >
            <Copy className="h-4 w-4" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => store.setNoteArchived(note.id, !note.archived)}>
            {note.archived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            {note.archived ? "Restaurar" : "Arquivar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              store.removeNote(note.id);
              toast.success(`"${title}" excluíd${note.kind === "notepad" ? "o" : "a"}`, {
                action: { label: "Desfazer", onClick: () => store.restoreNote(note) },
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
