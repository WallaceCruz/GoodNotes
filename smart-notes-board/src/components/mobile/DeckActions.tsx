import { Check, ChevronLeft, ChevronRight, Maximize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ações do card que está na frente.
 *
 * Ficam em botões — e não em gestos — porque são as operações que mudam a nota.
 * Um deslize errado no bolso não pode concluir uma tarefa; um toque num alvo de
 * 44px, não.
 */
export function DeckActions({
  position,
  total,
  done,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
  onToggleDone,
  onOpen,
}: {
  position: number;
  total: number;
  done: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleDone: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="shrink-0 px-4 pb-3">
      <p className="mb-2 text-center text-xs tabular-nums text-muted-foreground">
        {position} de {total}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPrevious}
          disabled={!canGoBack}
          aria-label="Nota anterior"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleDone}
          aria-label={done ? "Reabrir nota" : "Concluir nota"}
          className={cn(
            "flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
            done
              ? "border border-border bg-background text-muted-foreground"
              : "bg-emerald-600 text-white",
          )}
        >
          {done ? <RotateCcw className="h-5 w-5" /> : <Check className="h-5 w-5" />}
          {done ? "Reabrir" : "Concluir"}
        </button>

        <button
          onClick={onOpen}
          aria-label="Abrir nota"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent"
        >
          <Maximize2 className="h-5 w-5" />
        </button>

        <button
          onClick={onNext}
          disabled={!canGoForward}
          aria-label="Próxima nota"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
