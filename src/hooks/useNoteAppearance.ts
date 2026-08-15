import { useCallback, useEffect, useState } from "react";

export type NoteStyle = "classic" | "paper" | "gradient" | "outline" | "glass" | "tape";
export type NoteCorners = "soft" | "rounded" | "sharp";
export type NoteShadow = "none" | "soft" | "strong";
export type NoteFont = "sans" | "serif" | "mono";

export type NoteAppearance = {
  style: NoteStyle;
  corners: NoteCorners;
  shadow: NoteShadow;
  tilt: boolean;
  font: NoteFont;
};

export const defaultNoteAppearance: NoteAppearance = {
  style: "classic",
  corners: "soft",
  shadow: "soft",
  tilt: false,
  font: "sans",
};

export const NOTE_STYLE_OPTIONS: { value: NoteStyle; label: string; hint: string }[] = [
  { value: "classic", label: "Clássica", hint: "Cor sólida com borda discreta" },
  { value: "paper", label: "Papel", hint: "Textura sutil e canto dobrado" },
  { value: "gradient", label: "Degradê", hint: "Transição suave da cor" },
  { value: "outline", label: "Contorno", hint: "Fundo claro com borda colorida" },
  { value: "glass", label: "Vidro", hint: "Translúcida com desfoque" },
  { value: "tape", label: "Fita", hint: "Post-it com fita adesiva no topo" },
];

export const NOTE_CORNER_OPTIONS: { value: NoteCorners; label: string }[] = [
  { value: "soft", label: "Suave" },
  { value: "rounded", label: "Arredondada" },
  { value: "sharp", label: "Reta" },
];

export const NOTE_SHADOW_OPTIONS: { value: NoteShadow; label: string }[] = [
  { value: "none", label: "Sem sombra" },
  { value: "soft", label: "Suave" },
  { value: "strong", label: "Marcante" },
];

export const NOTE_FONT_OPTIONS: { value: NoteFont; label: string }[] = [
  { value: "sans", label: "Sem serifa" },
  { value: "serif", label: "Serifada" },
  { value: "mono", label: "Monoespaçada" },
];

const KEY = "sticky-flow:note-appearance";
const EVENT = "sticky-flow-note-appearance";

function read(): NoteAppearance {
  if (typeof window === "undefined") return defaultNoteAppearance;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaultNoteAppearance, ...JSON.parse(raw) } : defaultNoteAppearance;
  } catch {
    return defaultNoteAppearance;
  }
}

export function useNoteAppearance() {
  const [appearance, setAppearance] = useState<NoteAppearance>(defaultNoteAppearance);

  useEffect(() => {
    setAppearance(read());
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<NoteAppearance>).detail;
      if (next) setAppearance(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setAppearance(read());
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const commit = useCallback((next: NoteAppearance) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setAppearance(next);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }, []);

  const update = useCallback(
    (patch: Partial<NoteAppearance>) => commit({ ...read(), ...patch }),
    [commit],
  );

  const reset = useCallback(() => commit(defaultNoteAppearance), [commit]);

  return { appearance, update, reset };
}
