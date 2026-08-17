import { Coffee, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { formatClock, POMODORO_DURATION, usePomodoro } from "@/hooks/usePomodoro";
import { cn } from "@/lib/utils";

export function PomodoroTimer({ noteId }: { noteId: string }) {
  const { state, toggle, reset, setPhase } = usePomodoro(noteId);
  const total = POMODORO_DURATION[state.phase];
  const progress = 1 - state.remaining / total;

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums">
          {formatClock(state.remaining)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {state.phase === "focus" ? "Foco" : "Pausa"} · {state.cycles} ciclo
          {state.cycles === 1 ? "" : "s"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={toggle}
            aria-label={state.running ? "Pausar pomodoro" : "Iniciar pomodoro"}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          >
            {state.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={reset}
            aria-label="Reiniciar pomodoro"
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            state.phase === "focus" ? "bg-primary" : "bg-emerald-500",
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>

      <div className="mt-2 flex gap-1.5">
        <button
          onClick={() => setPhase("focus")}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] hover:bg-accent",
            state.phase === "focus" ? "border-primary bg-primary/10" : "border-border",
          )}
        >
          <Timer className="h-3 w-3" /> Foco 25 min
        </button>
        <button
          onClick={() => setPhase("break")}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] hover:bg-accent",
            state.phase === "break" ? "border-primary bg-primary/10" : "border-border",
          )}
        >
          <Coffee className="h-3 w-3" /> Pausa 5 min
        </button>
      </div>
    </div>
  );
}

/** Botão compacto usado nos cards do quadro. */
export function PomodoroMini({ noteId }: { noteId: string }) {
  const { state, toggle } = usePomodoro(noteId);
  const active = state.running || state.remaining !== POMODORO_DURATION[state.phase];
  return (
    <button
      onClick={toggle}
      aria-label={state.running ? "Pausar pomodoro" : "Iniciar pomodoro"}
      title="Pomodoro"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        active
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-border bg-background/60 text-muted-foreground",
      )}
    >
      {state.running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      <span className="font-mono tabular-nums">{formatClock(state.remaining)}</span>
    </button>
  );
}
