import type { NoteColor } from "@/lib/board-types";

export const noteBg: Record<NoteColor, string> = {
  rose: "bg-note-rose",
  amber: "bg-note-amber",
  lime: "bg-note-lime",
  sky: "bg-note-sky",
  violet: "bg-note-violet",
  peach: "bg-note-peach",
};

export const noteLabel: Record<NoteColor, string> = {
  rose: "Rosa",
  amber: "Amarelo",
  lime: "Verde",
  sky: "Azul",
  violet: "Lilás",
  peach: "Laranja",
};

export function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Ontem" : `${d} d`;
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
