import { deadlineStatus } from "@/lib/board/deadline";
import type { NoteColor, NoteStatus, Priority } from "@/lib/board-types";

/**
 * Mapas de cor e classe das notas. Só aparência: a regra por trás de cada
 * valor (o que é um prazo atrasado, o que conta como conteúdo) mora em
 * `lib/board/*` e `lib/*`, e aqui só decidimos como isso é pintado.
 */

export const noteBg: Record<NoteColor, string> = {
  rose: "bg-note-rose",
  amber: "bg-note-amber",
  lime: "bg-note-lime",
  sky: "bg-note-sky",
  violet: "bg-note-violet",
  peach: "bg-note-peach",
  teal: "bg-note-teal",
  indigo: "bg-note-indigo",
  sand: "bg-note-sand",
  mint: "bg-note-mint",
  coral: "bg-note-coral",
  slate: "bg-note-slate",
  white: "bg-note-white",
};

export const noteHeaderBg: Record<NoteColor, string> = {
  rose: "bg-note-rose/40",
  amber: "bg-note-amber/40",
  lime: "bg-note-lime/40",
  sky: "bg-note-sky/40",
  violet: "bg-note-violet/40",
  peach: "bg-note-peach/40",
  teal: "bg-note-teal/40",
  indigo: "bg-note-indigo/40",
  sand: "bg-note-sand/40",
  mint: "bg-note-mint/40",
  coral: "bg-note-coral/40",
  slate: "bg-note-slate/40",
  white: "bg-note-white/40",
};

export const noteLabel: Record<NoteColor, string> = {
  rose: "Rosa",
  amber: "Amarelo",
  lime: "Verde",
  sky: "Azul",
  violet: "Lilás",
  peach: "Laranja",
  teal: "Turquesa",
  indigo: "Índigo",
  sand: "Areia",
  mint: "Menta",
  coral: "Coral",
  slate: "Cinza",
  white: "Branco",
};

export const priorityClass: Record<Priority, string> = {
  urgent: "border-transparent bg-prio-urgent text-prio-urgent-foreground",
  high: "border-transparent bg-prio-high text-prio-high-foreground",
  medium: "border-transparent bg-prio-medium text-prio-medium-foreground",
  low: "border-transparent bg-prio-low text-prio-low-foreground",
};

export const statusClass: Record<NoteStatus, string> = {
  done: "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  doing: "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-blue-300",
  pending: "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  undone: "border-destructive/50 bg-destructive/15 text-destructive",
  rescheduled: "border-purple-500/50 bg-purple-500/15 text-purple-700 dark:text-purple-300",
};

/** Urgência do prazo traduzida em cor: vencido, perto de vencer ou tranquilo. */
export function deadlineTone(diff: number): string {
  if (diff < 0) return "border-destructive/50 bg-destructive/15";
  if (diff <= 2) return "border-note-peach bg-note-peach";
  return "border-border bg-muted";
}

/** Prazo pronto para exibir: o texto vem do domínio, a cor vem daqui. */
export function deadlineInfo(timestamp: number | null) {
  const status = deadlineStatus(timestamp);
  return status && { ...status, tone: deadlineTone(status.diff) };
}
