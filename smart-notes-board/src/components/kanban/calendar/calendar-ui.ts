import type { CalendarViewMode } from "@/lib/board/calendar";

/**
 * Vocabulário visual do calendário: os rótulos e as opções que as telas dele
 * compartilham.
 *
 * Estava espalhado dentro dos próprios componentes — `WEEKDAYS` morava no
 * `MonthGrid` e a grade de horas o importava de lá, o que fazia um componente
 * depender de outro só por causa de uma constante. Como módulo à parte, cada
 * componente exporta apenas o que desenha.
 */

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const VIEW_LABEL: Record<CalendarViewMode, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

/** Intervalos de encaixe do horário, em minutos. */
export const SNAP_OPTIONS = [5, 10, 15, 30, 60];

export type CalendarFilters = {
  withDeadline: boolean;
  withoutDeadline: boolean;
  archived: boolean;
};
