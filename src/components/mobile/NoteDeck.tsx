import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeckCard } from "./DeckCard";
import type { SwipeDeck } from "./useSwipeDeck";
import type { Column, Note } from "@/lib/board-types";

/** Quantas cartas de trás ficam visíveis. Mais que isso vira ruído, não profundidade. */
const CARDS_BEHIND = 2;

/** Rotação máxima do card enquanto arrasta — o suficiente para parecer físico. */
const MAX_TILT_DEG = 8;

export function NoteDeck({
  notes,
  columns,
  deck,
}: {
  notes: Note[];
  columns: Column[];
  deck: SwipeDeck;
}) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground" />
        <p className="text-base font-semibold">Nada na fila</p>
        <p className="text-sm text-muted-foreground">
          Todas as notas deste arquivo estão concluídas ou arquivadas.
        </p>
      </div>
    );
  }

  const visible = notes.slice(deck.index, deck.index + CARDS_BEHIND + 1);

  return (
    <div className="relative flex-1 px-4 pb-2 pt-3">
      {/* As de trás primeiro, para a da frente ficar por cima sem depender de z-index. */}
      {visible
        .map((note, depth) => ({ note, depth }))
        .reverse()
        .map(({ note, depth }) => {
          const isTop = depth === 0;
          // Quanto mais o dedo arrasta, mais a carta seguinte se aproxima da frente.
          const reveal = Math.min(1, Math.abs(deck.offset) / 140);
          const depthShift = depth - (isTop ? 0 : reveal);

          return (
            <div
              key={note.id}
              aria-hidden={!isTop}
              {...(isTop ? deck.handlers : {})}
              className={cn(
                // `bottom-9` reserva a faixa onde as cartas de trás aparecem.
                "absolute inset-x-4 bottom-9 top-3 touch-pan-y",
                isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
                // Sem transição durante o arraste: o card tem que seguir o dedo.
                !deck.dragging && "transition-transform duration-300 ease-out",
                "motion-reduce:transition-none",
              )}
              style={{
                // Origem na base: encolher mantém o rodapé no lugar, e só então
                // o deslocamento para baixo revela a borda da carta seguinte.
                transformOrigin: "bottom center",
                transform: isTop
                  ? `translateX(${deck.offset}px) rotate(${(deck.offset / 260) * MAX_TILT_DEG}deg)`
                  : `translateY(${depthShift * 16}px) scale(${1 - depthShift * 0.05})`,
                opacity: isTop ? 1 : 1 - depthShift * 0.2,
              }}
            >
              <DeckCard note={note} columns={columns} />
            </div>
          );
        })}
    </div>
  );
}
