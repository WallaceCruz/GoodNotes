import { effectiveStatus, type Column, type Note, type Priority } from "@/lib/board-types";
import { daysUntil } from "@/lib/date";

/**
 * A fila de "o que fazer agora".
 *
 * No celular não há espaço para o quadro inteiro, então a ordem das colunas
 * deixa de ser a forma de navegar e a urgência assume esse papel: o topo da
 * pilha é sempre a nota que mais precisa de atenção. A regra vive aqui, fora da
 * tela, porque é a mesma pergunta que um resumo diário ou uma notificação
 * fariam.
 */

const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Sem prioridade definida, a nota fica atrás de todas as que têm. */
const priorityWeight = (note: Note) =>
  note.priority ? PRIORITY_WEIGHT[note.priority] : PRIORITY_WEIGHT.low + 1;

/**
 * Faixas de urgência do prazo. São degraus, e não o número de dias direto,
 * para que a prioridade decida entre duas notas da mesma faixa — "vence esta
 * semana e é urgente" vem antes de "vence esta semana e é baixa".
 */
function deadlineWeight(note: Note): number {
  if (!note.deadline) return 4;
  const days = daysUntil(note.deadline);
  if (days < 0) return 0; // atrasada
  if (days === 0) return 1; // hoje
  if (days <= 3) return 2; // esta semana
  return 3;
}

/** Fixadas no topo; depois urgência do prazo, prioridade e edição mais recente. */
export function compareByUrgency(a: Note, b: Note): number {
  return (
    Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
    deadlineWeight(a) - deadlineWeight(b) ||
    priorityWeight(a) - priorityWeight(b) ||
    (a.deadline ?? Infinity) - (b.deadline ?? Infinity) ||
    b.updatedAt - a.updatedAt
  );
}

/** Notas que ainda pedem ação: nem arquivadas, nem concluídas. */
export function isOpen(note: Note, columns: Column[]): boolean {
  return !note.archived && effectiveStatus(note, columns) !== "done";
}

/** O baralho: só o que está aberto, do mais urgente para o menos. */
export function triageDeck(notes: Note[], columns: Column[]): Note[] {
  return notes.filter((note) => isOpen(note, columns)).sort(compareByUrgency);
}
