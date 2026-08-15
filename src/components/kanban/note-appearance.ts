import type { CSSProperties } from "react";
import type { NoteAppearance } from "@/hooks/useNoteAppearance";
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
};

const surface: Record<NoteAppearance["style"], string> = {
  classic: "note-surface-classic",
  paper: "note-surface-paper",
  gradient: "note-surface-gradient",
  outline: "note-surface-outline",
  glass: "note-surface-glass",
  tape: "note-surface-tape",
};

const notepad: Record<NoteAppearance["notepadStyle"], string> = {
  plain: "notepad-surface-plain",
  lined: "notepad-surface-lined",
  grid: "notepad-surface-grid",
  dotted: "notepad-surface-dotted",
  paper: "notepad-surface-paper",
  accent: "notepad-surface-accent",
};

const corners: Record<NoteAppearance["corners"], string> = {
  soft: "rounded-lg",
  rounded: "rounded-2xl",
  sharp: "rounded-none",
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
    corners[appearance.corners],
    shadow[appearance.shadow],
    font[appearance.font],
    size[appearance.size],
    align[appearance.align],
  ];
}

export function noteSurface(
  appearance: NoteAppearance,
  color: NoteColor,
  opts: { tilt?: boolean } = {},
): { className: string; style: CSSProperties } {
  const classes = [surface[appearance.style], ...shared(appearance)];
  if (appearance.tilt && opts.tilt !== false) classes.push("note-tilt");
  return {
    className: classes.join(" "),
    style: colorVars(appearance, noteTintVar[color]),
  };
}

export function notepadSurface(
  appearance: NoteAppearance,
  opts: { tilt?: boolean } = {},
): { className: string; style: CSSProperties } {
  const classes = [notepad[appearance.notepadStyle], ...shared(appearance)];
  if (appearance.tilt && opts.tilt !== false) classes.push("note-tilt");
  return {
    className: classes.join(" "),
    style: colorVars(appearance, "var(--color-card)"),
  };
}
