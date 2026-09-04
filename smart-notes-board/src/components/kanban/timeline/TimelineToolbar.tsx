import { GanttChartSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIMELINE_SCALES, type TimelineScale } from "./timeline-scale";

const NAV_BUTTON =
  "rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent";

/** Cabeçalho: escala de tempo e navegação pelo período. */
export function TimelineToolbar({
  scale,
  onChangeScale,
  onMove,
  onGoToday,
}: {
  scale: TimelineScale;
  onChangeScale: (scale: TimelineScale) => void;
  /** -1 volta meio período, +1 avança meio período. */
  onMove: (direction: -1 | 1) => void;
  onGoToday: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
      <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">Linha do tempo</span>

      <div className="ml-2 flex items-center gap-1 rounded-md border border-border p-0.5">
        {TIMELINE_SCALES.map((option) => (
          <button
            key={option.value}
            onClick={() => onChangeScale(option.value)}
            className={cn(
              "rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent",
              scale === option.value && "bg-accent font-medium text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => onMove(-1)} className={NAV_BUTTON}>
          Anterior
        </button>
        <button onClick={onGoToday} className={NAV_BUTTON}>
          Hoje
        </button>
        <button onClick={() => onMove(1)} className={NAV_BUTTON}>
          Próximo
        </button>
      </div>

      <span className="ml-auto text-xs text-muted-foreground">
        Arraste as barras para mover; use as pontas para ajustar início e prazo.
      </span>
    </div>
  );
}
