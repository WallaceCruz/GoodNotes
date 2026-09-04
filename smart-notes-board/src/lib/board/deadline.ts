import { daysUntil, formatDateTime, formatTime } from "@/lib/date";

/**
 * Leitura de um prazo — quanto falta e como dizer isso em palavras.
 *
 * Sem nenhuma classe de CSS aqui de propósito: a cor do aviso é decisão da
 * camada visual (`note-style`), e assim esta regra serve igual para um badge,
 * um e-mail de lembrete ou um relatório.
 */
export type DeadlineStatus = {
  /** Dias inteiros até o prazo: negativo = atrasado, 0 = hoje. */
  diff: number;
  label: string;
  time: string;
  date: string;
};

export function deadlineStatus(timestamp: number | null): DeadlineStatus | null {
  if (!timestamp) return null;
  const diff = daysUntil(timestamp);
  const time = formatTime(timestamp);
  const label =
    diff < 0
      ? `Atrasado ${Math.abs(diff)}d`
      : diff === 0
        ? `Vence hoje ${time}`
        : diff === 1
          ? `Vence amanhã ${time}`
          : `Em ${diff} dias`;
  return { diff, label, time, date: formatDateTime(timestamp) };
}
