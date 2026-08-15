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

export function noteSurface(
  appearance: NoteAppearance,
  color: NoteColor,
  opts: { tilt?: boolean } = {},
): { className: string; style: CSSProperties } {
  const classes = [
    surface[appearance.style],
    corners[appearance.corners],
    shadow[appearance.shadow],
    font[appearance.font],
  ];
  if (appearance.tilt && opts.tilt !== false) classes.push("note-tilt");
  return {
    className: classes.join(" "),
    style: { ["--note-tint" as string]: noteTintVar[color] } as CSSProperties,
  };
}

export function notepadSurface(appearance: NoteAppearance): {
  className: string;
  style: CSSProperties;
} {
  return {
    className: [corners[appearance.corners], shadow[appearance.shadow], font[appearance.font]].join(
      " ",
    ),
    style: {},
  };
}
