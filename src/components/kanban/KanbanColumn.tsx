import { useDroppable } from "@dnd-kit/core";
import { memo, useMemo, useState } from "react";
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
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Copy,
  FlaskConical,
  GripVertical,
  Inbox,
  Loader,
  MoreHorizontal,
  Eye,
  NotebookPen,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  NOTE_COLORS,
  type Column,
  type NativeColumnKey,
  type Note,
  type NoteKind,
} from "@/lib/board-types";
import { boardActions, useActiveProjectId } from "@/stores/board";
import { DEFAULT_COLUMN_COLORS, useNoteAppearance } from "@/stores/noteAppearance";

const NATIVE_ICON: Record<NativeColumnKey, typeof Inbox> = {
  backlog: Inbox,
  research: FlaskConical,
  discovery: Compass,
  doing: Loader,
  validation: Eye,
  done: CheckCircle2,
};
import { cn } from "@/lib/utils";
import { columnSortableId } from "./column-drag";
import { noteBg, noteHeaderBg, noteLabel } from "./note-style";
import { NotepadCard } from "./NotepadCard";
import { StickyNoteCard } from "./StickyNoteCard";

const PAGE = 30;

function KanbanColumnBase({
  column,
  notes,
  activeNoteId,
  index,
  total,
  onAddNote,
  onOpenNote,
  highlightIds,
}: {
  column: Column;
  notes: Note[];
  activeNoteId: string | null;
  index: number;
  total: number;
  onAddNote: (kind: NoteKind) => void;
  onOpenNote: (id: string, mode?: "view" | "edit") => void;
  highlightIds?: Set<string> | undefined;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column-body", columnId: column.id },
  });
  // Arraste da coluna inteira: só pela alça, para não conflitar com o título e os botões.
  const {
    attributes,
    listeners,
    setNodeRef: setColumnRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnSortableId(column.id),
    data: { type: "column", columnId: column.id },
    transition: { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  });
  // Limite de render: listas grandes só montam os primeiros cards.
  const [limit, setLimit] = useState(PAGE);
  const visible = useMemo(() => notes.slice(0, limit), [notes, limit]);
  const sortableIds = useMemo(() => visible.map((n) => n.id), [visible]);
  const isNative = Boolean(column.native);
  const activeProjectId = useActiveProjectId();
  const { appearance } = useNoteAppearance(activeProjectId);
  const accent =
    column.native && appearance.nativeColumnColors
      ? (appearance.columnColors[column.native] ?? DEFAULT_COLUMN_COLORS[column.native])
      : null;

  return (
    <div
      ref={setColumnRef}
      className={cn(
        "flex max-h-full w-96 shrink-0 flex-col overflow-hidden rounded-lg border bg-card/70 backdrop-blur-sm",
        !accent && "border-border",
        isDragging && "opacity-40 ring-2 ring-dashed ring-ring/40",
      )}
      style={{
        ...(accent ? { borderColor: `${accent}99`, backgroundColor: `${accent}26` } : null),
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      <div
        className={cn("h-1.5 w-full", column.color ? noteBg[column.color] : "bg-transparent")}
      />

      <div
        className={cn(
          "flex items-center gap-1 border-b px-3 py-2",
          !accent && "border-border",
          column.color ? noteHeaderBg[column.color] : undefined,
        )}
        style={accent ? { borderColor: `${accent}4d` } : undefined}
      >
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reordenar coluna ${column.title}`}
          title="Arraste para mudar a posição da coluna"
          className="-ml-1 shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/70 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {isNative ? (() => {
          const Icon = NATIVE_ICON[column.native!];
          return (
            <span
              title="Coluna nativa do fluxo"
              className="flex w-full items-center gap-1.5 truncate text-sm font-semibold"
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", !accent && "text-muted-foreground")}
                style={accent ? { color: accent } : undefined}
              />
              {column.title}
            </span>
          );
        })() : (
          <input
            value={column.title}
            onChange={(e) => boardActions.renameColumn(column.id, e.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        )}
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
                    onClick={() => boardActions.setColumnColor(column.id, null)}
                    className={cn(
                      "h-5 w-5 rounded-full border border-border bg-background",
                      !column.color && "ring-2 ring-ring ring-offset-1 ring-offset-background",
                    )}
                  />
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      title={noteLabel[c]}
                      onClick={() => boardActions.setColumnColor(column.id, c)}
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
                disabled={index === 0}
                onClick={() => boardActions.moveColumnBy(column.id, -1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Mover para a esquerda
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === total - 1}
                onClick={() => boardActions.moveColumnBy(column.id, 1)}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Mover para a direita
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  boardActions.duplicateColumn(column.id);
                  toast.success(`Coluna "${column.title}" duplicada`);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicar coluna
              </DropdownMenuItem>
              {isNative ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Coluna nativa do fluxo (não excluível)
                </DropdownMenuItem>
              ) : (
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir coluna
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              )}
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
                  boardActions.removeColumn(column.id);
                  toast.success(`Coluna "${column.title}" excluída`, {
                    description: removedNotes.length
                      ? `${removedNotes.length} nota(s) removida(s) junto.`
                      : undefined,
                    action: {
                      label: "Desfazer",
                      onClick: () => boardActions.restoreColumn(column, removedNotes),
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
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {visible.map((n) => {
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
                  active={activeNoteId === n.id}
                  onOpen={(mode) => onOpenNote(n.id, mode)}
                />
              </div>
            );
          })}
        </SortableContext>
        {notes.length > visible.length && (
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="shrink-0 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-accent"
          >
            Mostrar mais {Math.min(PAGE, notes.length - visible.length)} de {notes.length - visible.length}
          </button>
        )}
        {isOver && (
          <div className="h-16 shrink-0 rounded-lg border-2 border-dashed border-ring/60 bg-background/40" />
        )}
      </div>
    </div>
  );
}

// A antiga comparação incluía o `store` inteiro porque ele chegava por prop; o
// que a coluna realmente lê dele (colunas, aparência) agora vem de assinaturas
// diretas ao Zustand, que já se re-renderizam sozinhas quando esse dado muda —
// então comparar só as props explícitas basta.
export const KanbanColumn = memo(
  KanbanColumnBase,
  (prev, next) =>
    prev.column === next.column &&
    prev.notes === next.notes &&
    prev.index === next.index &&
    prev.total === next.total &&
    prev.activeNoteId === next.activeNoteId &&
    prev.highlightIds === next.highlightIds,
);
