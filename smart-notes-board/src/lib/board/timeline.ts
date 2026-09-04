import { DAY_MS } from "@/lib/date";
import { noteRange } from "./notes";
import type { Column, Note } from "./model";

/**
 * Regras da linha do tempo: como as notas se organizam em faixas e onde cada
 * barra começa e termina.
 *
 * Ficam fora do componente porque respondem a perguntas que não dependem de
 * tela — "esta nota está atrasada?", "que notas ainda não têm data?" — e por
 * isso podem ser lidas e testadas sem montar a grade.
 */

export type TimelineRow = { column: Column; notes: Note[] };
export type NoteRange = { start: number; end: number };

/** Notas por coluna, cada faixa ordenada por quando começa. */
export function timelineRows(notes: Note[], columns: Column[]): TimelineRow[] {
  return columns.map((column) => ({
    column,
    notes: notes
      .filter((note) => note.columnId === column.id)
      .sort((a, b) => (noteRange(a)?.start ?? 0) - (noteRange(b)?.start ?? 0)),
  }));
}

/** Notas sem data nenhuma — ficam na faixa "sem prazo", esperando um arraste. */
export function unscheduledNotes(notes: Note[]): Note[] {
  return notes.filter((note) => !noteRange(note));
}

/**
 * Posição e largura da barra em pixels.
 *
 * A largura mínima existe porque uma tarefa de um dia numa escala de meses
 * viraria um risco de 16px, impossível de ler ou de pegar com o mouse.
 */
export function barGeometry(
  range: NoteRange,
  rangeStart: number,
  pixelsPerDay: number,
  minWidth: number,
): { left: number; width: number } {
  return {
    left: ((range.start - rangeStart) / DAY_MS) * pixelsPerDay,
    width: Math.max(minWidth, ((range.end - range.start) / DAY_MS) * pixelsPerDay),
  };
}

/** Prazo vencido e a nota não foi concluída. */
export function isOverdue(range: NoteRange | null, today: number, done: boolean): boolean {
  return !!range && range.end < today && !done;
}
