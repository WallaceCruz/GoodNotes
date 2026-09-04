import { MousePointerClick, Trash2, X } from "lucide-react";
import { toastUndo } from "@/lib/toast";
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
import { boardActions, useActiveFile, useSelectedNoteIds } from "@/stores/board";

/**
 * Barra de exclusão em massa: aparece no lugar do quadro normal enquanto o
 * modo de seleção está ativo (ligado pelo botão "Selecionar" no cabeçalho).
 */
export function SelectionToolbar() {
  const activeFile = useActiveFile();
  const selectedIds = useSelectedNoteIds();
  const count = selectedIds.length;
  const total = activeFile?.notes.length ?? 0;

  const handleDelete = () => {
    const removed = (activeFile?.notes ?? []).filter((n) => selectedIds.includes(n.id));
    boardActions.removeNotes(selectedIds);
    boardActions.toggleSelectionMode();
    toastUndo(`${removed.length} nota(s) excluída(s)`, () => boardActions.restoreNotes(removed));
  };

  return (
    <div className="flex items-center gap-2 border-b border-border bg-accent/40 px-4 py-2 text-sm">
      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">
        {count > 0 ? `${count} nota(s) selecionada(s)` : "Selecione as notas para excluir"}
      </span>
      <button
        onClick={() => boardActions.selectAllNotes((activeFile?.notes ?? []).map((n) => n.id))}
        disabled={total === 0 || count === total}
        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-40"
      >
        Selecionar tudo
      </button>
      <button
        onClick={() => boardActions.clearSelection()}
        disabled={count === 0}
        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-40"
      >
        Limpar seleção
      </button>
      <div className="ml-auto flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={count === 0}
              className="flex items-center gap-1.5 rounded-md border border-destructive/40 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir selecionadas
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {count} nota(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                As notas selecionadas serão removidas do quadro. Você pode desfazer logo em seguida
                pelo aviso que aparece na tela.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <button
          onClick={() => boardActions.toggleSelectionMode()}
          aria-label="Sair do modo de seleção"
          title="Sair do modo de seleção"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
