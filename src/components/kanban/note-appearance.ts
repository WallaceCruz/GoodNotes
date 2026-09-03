import type { CSSProperties } from "react";
import type { NoteAppearance } from "@/stores/noteAppearance";
import type { NoteColor } from "@/lib/board-types";

export const noteTintVar: Record<NoteColor, string> = {
  rose: "var(--note-rose)",
  amber: "var(--note-amber)",
  lime: "var(--note-lime)",
  sky: "var(--note-sky)",
  violet: "var(--note-violet)",
  peach: "var(--note-peach)",
  teal: "var(--note-teal)",
  indigo: "var(--note-indigo)",
  sand: "var(--note-sand)",
  mint: "var(--note-mint)",
  coral: "var(--note-coral)",
  slate: "var(--note-slate)",
  white: "var(--note-white)",
};

const surface: Record<NoteAppearance["style"], string> = {
  classic: "note-surface-classic",
  soft: "note-surface-soft",
  gradient: "note-surface-gradient",
  outline: "note-surface-outline",
  glass: "note-surface-glass",
  tape: "note-surface-tape",
};

const corners: Record<NoteAppearance["corners"], string> = {
  sharp: "rounded-none",
  soft: "rounded-lg",
  rounded: "rounded-2xl",
  xl: "note-corner-xl",
  pill: "note-corner-pill",
  notched: "note-corner-notched",
};

const shadow: Record<NoteAppearance["shadow"], string> = {
  none: "shadow-none hover:shadow-card",
  soft: "shadow-card hover:shadow-card-hover",
  strong: "shadow-focus hover:shadow-focus",
};

const font: Record<NoteAppearance["font"], string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
};

const size: Record<NoteAppearance["size"], string> = {
  sm: "note-size-sm",
  md: "note-size-md",
  lg: "note-size-lg",
};

const align: Record<NoteAppearance["align"], string> = {
  left: "text-left",
  center: "note-align-center",
};

function colorVars(appearance: NoteAppearance, tint: string): CSSProperties {
  const vars: Record<string, string> = { "--note-tint": appearance.bgColor ?? tint };
  if (appearance.titleColor) vars["--note-title"] = appearance.titleColor;
  if (appearance.accentColor) vars["--note-accent"] = appearance.accentColor;
  return vars as CSSProperties;
}

function shared(appearance: NoteAppearance): string[] {
  return [
    corners[appearance.corners] ?? corners.soft,
    shadow[appearance.shadow] ?? shadow.soft,
    font[appearance.font] ?? font.sans,
    size[appearance.size] ?? size.md,
    align[appearance.align] ?? align.left,
  ];
}

export function noteSurface(
  appearance: NoteAppearance,
  color: NoteColor,
  opts: { tilt?: boolean; tint?: string | null } = {},
): { className: string; style: CSSProperties } {
  const classes = [surface[appearance.style] ?? surface.classic, ...shared(appearance)];
  if (appearance.tilt && opts.tilt !== false) classes.push("note-tilt");
  const style = colorVars(appearance, noteTintVar[color]);
  // Cor personalizada da nota tem prioridade sobre a cor global da aparência.
  if (opts.tint) (style as Record<string, string>)["--note-tint"] = opts.tint;
  // Notas brancas precisam de texto escuro para permanecerem legíveis no dark mode.
  if (color === "white" && !opts.tint) {
    (style as Record<string, string>)["--note-foreground"] = "oklch(0.24 0.012 275)";
  }
  return { className: classes.join(" "), style };
}
