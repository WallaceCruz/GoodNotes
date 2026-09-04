/**
 * As escalas da linha do tempo e os rótulos das datas.
 *
 * `pixelsPerDay` é o que define tudo o mais: quantos dias cabem, se o cabeçalho
 * mostra o mês ou só a inicial do dia, e a largura das barras.
 */

export type TimelineScale = "day" | "week" | "month";

export const TIMELINE_SCALES: {
  value: TimelineScale;
  label: string;
  pixelsPerDay: number;
  days: number;
}[] = [
  { value: "day", label: "Dia", pixelsPerDay: 96, days: 14 },
  { value: "week", label: "Semana", pixelsPerDay: 40, days: 42 },
  { value: "month", label: "Mês", pixelsPerDay: 16, days: 120 },
];

/** Abaixo desta largura a barra deixa de ser clicável com conforto. */
export const MIN_BAR_WIDTH = 280;

/** Iniciais do dia da semana, no espaço de um caractere. */
export const WEEKDAY_INITIAL = ["D", "S", "T", "Q", "Q", "S", "S"];

export const MONTH_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export const scaleConfig = (scale: TimelineScale) =>
  TIMELINE_SCALES.find((option) => option.value === scale) ?? TIMELINE_SCALES[1]!;
