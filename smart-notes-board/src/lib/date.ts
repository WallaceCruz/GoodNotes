/**
 * Datas do quadro.
 *
 * Antes cada tela tinha sua própria versão: `startOfDay` no timeline, o mesmo
 * `setHours(0,0,0,0)` solto no note-style, `dayKey` exportado pelo calendário e
 * reescrito à mão na rota, e o fim do dia (23:59) repetido em três lugares com
 * um deles divergindo em um segundo. Concentrar aqui torna a regra de "que dia
 * é este timestamp" única e testável sem montar componente nenhum.
 */

const LOCALE = "pt-BR";

/** Hora usada quando o usuário escolhe só a data: o prazo vence no fim do dia. */
export const END_OF_DAY = { hour: 23, minute: 59 } as const;

export const DAY_MS = 86_400_000;

export function startOfDay(value: number | Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value: number | Date): Date {
  const date = new Date(value);
  date.setHours(END_OF_DAY.hour, END_OF_DAY.minute, 0, 0);
  return date;
}

export function withTime(value: number | Date, hour: number, minute: number): number {
  const date = new Date(value);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

export function addDays(value: number | Date, days: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Chave estável de um dia, para agrupar e comparar sem depender do horário.
 * O mês é 0-based porque é o formato que o calendário já persiste na seleção.
 */
export function dayKey(value: number | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Meio-dia evita que fuso horário jogue a data para o dia anterior. */
export function dateFromDayKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year!, month!, day!, 12, 0, 0, 0);
}

/** Dias inteiros entre hoje e o alvo: negativo = passado, 0 = hoje. */
export function daysUntil(value: number | Date, from: number | Date = Date.now()): number {
  return Math.round((startOfDay(value).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function formatTime(value: number | Date): string {
  return new Date(value).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(value: number | Date): string {
  return new Date(value).toLocaleDateString(LOCALE);
}

export function formatDateTime(value: number | Date): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}

/** Distância humana desde um timestamp ("agora", "12 min", "3 h", "Ontem"). */
export function timeAgo(timestamp: number): string {
  const minutes = Math.round(Math.max(0, Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Ontem" : `${days} d`;
}
