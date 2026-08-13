import type { NoteColor, Priority } from "@/lib/board-types";

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
};

export const noteAccent: Record<NoteColor, string> = {
  rose: "bg-note-rose/60",
  amber: "bg-note-amber/60",
  lime: "bg-note-lime/60",
  sky: "bg-note-sky/60",
  violet: "bg-note-violet/60",
  peach: "bg-note-peach/60",
  teal: "bg-note-teal/60",
  indigo: "bg-note-indigo/60",
  sand: "bg-note-sand/60",
  mint: "bg-note-mint/60",
  coral: "bg-note-coral/60",
  slate: "bg-note-slate/60",
};

export const priorityClass: Record<Priority, string> = {
  urgent: "border-destructive/50 bg-destructive/15 text-foreground",
  high: "border-note-peach bg-note-peach text-foreground",
  medium: "border-note-sky bg-note-sky text-foreground",
  low: "border-border bg-muted text-muted-foreground",
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

export function toDateInput(ts: number | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateInput(value: string): number | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59).getTime();
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function deadlineInfo(ts: number | null) {
  if (!ts) return null;
  const dayMs = 86_400_000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(ts);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / dayMs);
  const time = formatTime(ts);
  const label =
    diff < 0
      ? `Atrasado ${Math.abs(diff)}d`
      : diff === 0
        ? `Vence hoje ${time}`
        : diff === 1
          ? `Vence amanhã ${time}`
          : `Em ${diff} dias`;
  const tone =
    diff < 0
      ? "border-destructive/50 bg-destructive/15"
      : diff <= 2
        ? "border-note-peach bg-note-peach"
        : "border-border bg-muted";
  return { diff, label, tone, date: new Date(ts).toLocaleDateString("pt-BR") };
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
