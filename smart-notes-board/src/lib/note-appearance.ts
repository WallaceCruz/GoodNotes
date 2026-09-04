import type { NativeColumnKey } from "@/lib/board/model";

/**
 * Vocabulário da aparência das notas: os estilos possíveis, os valores padrão e
 * as opções que a tela de configuração oferece.
 *
 * Fica fora do store de propósito. Quem *desenha* uma nota (a camada
 * `components/note`) precisa do formato, não do armazenamento — e apontar para
 * o store invertia a direção: apresentação dependendo de estado global. Assim o
 * store passa a ser só mais um consumidor deste vocabulário.
 */

export type NoteStyle =
  | "classic"
  | "soft"
  | "gradient"
  | "duo"
  | "radial"
  | "sunset"
  | "paper"
  | "outline"
  | "glass"
  | "neon"
  | "tape";
export type NoteCorners = "sharp" | "soft" | "rounded" | "xl" | "pill" | "notched";
export type NoteShadow = "none" | "soft" | "strong" | "colored" | "inset" | "lifted";
export type NoteBorder = "none" | "thin" | "thick" | "dashed" | "double";
export type NoteFont = "sans" | "serif" | "mono";
export type NoteSize = "sm" | "md" | "lg";
export type NoteAlign = "left" | "center";

export type NoteAppearance = {
  style: NoteStyle;
  corners: NoteCorners;
  shadow: NoteShadow;
  border: NoteBorder;
  tilt: boolean;
  font: NoteFont;
  size: NoteSize;
  align: NoteAlign;
  /** Overrides de cor (CSS color) — null usa a cor da nota/tema */
  bgColor: string | null;
  titleColor: string | null;
  accentColor: string | null;
  /** Colore as colunas nativas do Kanban com a paleta do fluxo */
  nativeColumnColors: boolean;
  /** Cor (hex) de cada coluna nativa quando o modo colorido está ligado */
  columnColors: Record<NativeColumnKey, string>;
};

export const DEFAULT_COLUMN_COLORS: Record<NativeColumnKey, string> = {
  backlog: "#9ca3af",
  research: "#f472b6",
  discovery: "#a855f7",
  doing: "#3b82f6",
  validation: "#f59e0b",
  done: "#22c55e",
};

export const defaultNoteAppearance: NoteAppearance = {
  style: "classic",
  corners: "soft",
  shadow: "soft",
  border: "thin",
  tilt: false,
  font: "sans",
  size: "md",
  align: "left",
  bgColor: null,
  titleColor: null,
  accentColor: null,
  nativeColumnColors: false,
  columnColors: DEFAULT_COLUMN_COLORS,
};

export const NOTE_STYLE_OPTIONS: { value: NoteStyle; label: string; hint: string }[] = [
  { value: "classic", label: "Clássica", hint: "Cor sólida com borda discreta" },
  { value: "soft", label: "Suave", hint: "Degradê discreto de cima para baixo" },
  { value: "gradient", label: "Degradê", hint: "Transição suave da cor" },
  { value: "duo", label: "Duotom", hint: "Degradê diagonal com cor de destaque" },
  { value: "radial", label: "Radial", hint: "Brilho saindo do centro" },
  { value: "sunset", label: "Aurora", hint: "Degradê em três tons" },
  { value: "paper", label: "Papel", hint: "Textura sutil com contorno fino" },
  { value: "outline", label: "Contorno", hint: "Fundo claro com borda colorida" },
  { value: "glass", label: "Vidro", hint: "Translúcida com desfoque" },
  { value: "neon", label: "Neon", hint: "Contorno vibrante com brilho" },
  { value: "tape", label: "Fita", hint: "Post-it com fita adesiva no topo" },
];

export const NOTE_CORNER_OPTIONS: { value: NoteCorners; label: string }[] = [
  { value: "sharp", label: "Reta" },
  { value: "soft", label: "Suave" },
  { value: "rounded", label: "Arredondada" },
  { value: "xl", label: "Extra" },
  { value: "pill", label: "Cápsula" },
  { value: "notched", label: "Chanfrada" },
];

export const NOTE_SHADOW_OPTIONS: { value: NoteShadow; label: string }[] = [
  { value: "none", label: "Sem sombra" },
  { value: "soft", label: "Suave" },
  { value: "strong", label: "Marcante" },
  { value: "colored", label: "Colorida" },
  { value: "inset", label: "Interna" },
  { value: "lifted", label: "Elevada" },
];

export const NOTE_BORDER_OPTIONS: { value: NoteBorder; label: string }[] = [
  { value: "none", label: "Sem borda" },
  { value: "thin", label: "Fina" },
  { value: "thick", label: "Grossa" },
  { value: "dashed", label: "Tracejada" },
  { value: "double", label: "Dupla" },
];

export const NOTE_FONT_OPTIONS: { value: NoteFont; label: string }[] = [
  { value: "sans", label: "Sem serifa" },
  { value: "serif", label: "Serifada" },
  { value: "mono", label: "Monoespaçada" },
];

export const NOTE_SIZE_OPTIONS: { value: NoteSize; label: string }[] = [
  { value: "sm", label: "Compacto" },
  { value: "md", label: "Padrão" },
  { value: "lg", label: "Confortável" },
];

export const NOTE_ALIGN_OPTIONS: { value: NoteAlign; label: string }[] = [
  { value: "left", label: "À esquerda" },
  { value: "center", label: "Centralizado" },
];
