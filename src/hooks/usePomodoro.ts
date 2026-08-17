import { useCallback, useEffect, useState } from "react";

export type PomodoroPhase = "focus" | "break";

export type PomodoroState = {
  noteId: string;
  phase: PomodoroPhase;
  running: boolean;
  /** segundos restantes */
  remaining: number;
  cycles: number;
};

export const POMODORO_DURATION: Record<PomodoroPhase, number> = {
  focus: 25 * 60,
  break: 5 * 60,
};

const timers = new Map<string, PomodoroState>();
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function tick() {
  let changed = false;
  for (const state of timers.values()) {
    if (!state.running) continue;
    changed = true;
    state.remaining -= 1;
    if (state.remaining <= 0) {
      const next: PomodoroPhase = state.phase === "focus" ? "break" : "focus";
      state.cycles = state.phase === "focus" ? state.cycles + 1 : state.cycles;
      state.phase = next;
      state.remaining = POMODORO_DURATION[next];
      state.running = false;
    }
  }
  if (changed) emit();
}

function ensureInterval() {
  if (interval || typeof window === "undefined") return;
  interval = setInterval(tick, 1000);
}

function get(noteId: string): PomodoroState {
  let s = timers.get(noteId);
  if (!s) {
    s = { noteId, phase: "focus", running: false, remaining: POMODORO_DURATION.focus, cycles: 0 };
    timers.set(noteId, s);
  }
  return s;
}

export function isPomodoroRunning(noteId: string) {
  return timers.get(noteId)?.running ?? false;
}

export function usePomodoro(noteId: string) {
  const [, force] = useState(0);

  useEffect(() => {
    ensureInterval();
    const listener = () => force((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const state = get(noteId);

  const toggle = useCallback(() => {
    const s = get(noteId);
    s.running = !s.running;
    emit();
  }, [noteId]);

  const reset = useCallback(() => {
    const s = get(noteId);
    s.running = false;
    s.remaining = POMODORO_DURATION[s.phase];
    emit();
  }, [noteId]);

  const setPhase = useCallback((phase: PomodoroPhase) => {
    const s = get(noteId);
    s.phase = phase;
    s.remaining = POMODORO_DURATION[phase];
    s.running = false;
    emit();
  }, [noteId]);

  return { state, toggle, reset, setPhase };
}

export function formatClock(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
