import { dateFromDayKey, dayKey } from "@/lib/date";
import type { Note } from "@/lib/board-types";

/**
 * Regras do calendário: que dias a grade mostra, que nota cai em que dia e
 * quais prazos colidem. Tudo função pura sobre `Note[]` — a tela só desenha o
 * que estas funções decidem.
 */

export type CalendarViewMode = "day" | "week" | "month";

/** Semana começa no domingo, como o cabeçalho da grade. */
function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return start;
}

function sequence(start: Date, length: number): Date[] {
  return Array.from({ length }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

/**
 * Dias desenhados na grade: um no modo dia, sete no modo semana e seis semanas
 * completas no modo mês (por isso 42 — o mês sempre cabe sem a grade mudar de
 * altura de um mês para o outro).
 */
export function calendarDays(view: CalendarViewMode, selectedKey: string, cursor: Date): Date[] {
  if (view === "day") return [dateFromDayKey(selectedKey)];
  if (view === "week") return sequence(startOfWeek(dateFromDayKey(selectedKey)), 7);
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  return sequence(startOfWeek(firstOfMonth), 42);
}

/** Notas com prazo, agrupadas pelo dia em que vencem. */
export function notesByDay(notes: Note[]): Map<string, Note[]> {
  const map = new Map<string, Note[]>();
  for (const note of notes) {
    if (!note.deadline) continue;
    const key = dayKey(note.deadline);
    map.set(key, [...(map.get(key) ?? []), note]);
  }
  return map;
}

export const byDeadline = (a: Note, b: Note) => (a.deadline ?? 0) - (b.deadline ?? 0);

/** Minuto do prazo — a granularidade em que dois prazos contam como conflito. */
const minuteOf = (deadline: number) => Math.floor(deadline / 60_000);

/**
 * Minutos em que mais de uma nota vence. Devolver o conjunto (e não uma
 * resposta por nota) evita percorrer a lista inteira para cada nota desenhada.
 */
export function findDeadlineConflicts(notes: Note[]): Set<number> {
  const perMinute = new Map<number, number>();
  for (const note of notes) {
    if (!note.deadline) continue;
    const minute = minuteOf(note.deadline);
    perMinute.set(minute, (perMinute.get(minute) ?? 0) + 1);
  }
  return new Set(
    [...perMinute.entries()].filter(([, count]) => count > 1).map(([minute]) => minute),
  );
}

export function hasConflict(note: Note, conflicts: Set<number>): boolean {
  return !!note.deadline && conflicts.has(minuteOf(note.deadline));
}
