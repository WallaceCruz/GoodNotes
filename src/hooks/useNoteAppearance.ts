import { useCallback, useEffect, useMemo, useState } from "react";

export type NoteStyle = "classic" | "paper" | "gradient" | "outline" | "glass" | "tape";
export type NotepadStyle = "plain" | "lined" | "grid" | "dotted" | "paper" | "accent";
export type NoteCorners = "soft" | "rounded" | "sharp";
export type NoteShadow = "none" | "soft" | "strong";
export type NoteFont = "sans" | "serif" | "mono";
export type NoteSize = "sm" | "md" | "lg";
export type NoteAlign = "left" | "center";

export type NoteAppearance = {
  style: NoteStyle;
  notepadStyle: NotepadStyle;
  corners: NoteCorners;
  shadow: NoteShadow;
  tilt: boolean;
  font: NoteFont;
  size: NoteSize;
  align: NoteAlign;
  /** Overrides de cor (CSS color) — null usa a cor da nota/tema */
  bgColor: string | null;
  titleColor: string | null;
  accentColor: string | null;
};

export const defaultNoteAppearance: NoteAppearance = {
  style: "classic",
  notepadStyle: "plain",
  corners: "soft",
  shadow: "soft",
  tilt: false,
  font: "sans",
  size: "md",
  align: "left",
  bgColor: null,
  titleColor: null,
  accentColor: null,
};

export const NOTE_STYLE_OPTIONS: { value: NoteStyle; label: string; hint: string }[] = [
  { value: "classic", label: "Clássica", hint: "Cor sólida com borda discreta" },
  { value: "paper", label: "Papel", hint: "Textura sutil e canto dobrado" },
  { value: "gradient", label: "Degradê", hint: "Transição suave da cor" },
  { value: "outline", label: "Contorno", hint: "Fundo claro com borda colorida" },
  { value: "glass", label: "Vidro", hint: "Translúcida com desfoque" },
  { value: "tape", label: "Fita", hint: "Post-it com fita adesiva no topo" },
];

export const NOTEPAD_STYLE_OPTIONS: { value: NotepadStyle; label: string; hint: string }[] = [
  { value: "plain", label: "Limpo", hint: "Fundo sólido, sem textura" },
  { value: "lined", label: "Pautado", hint: "Linhas horizontais de caderno" },
  { value: "grid", label: "Quadriculado", hint: "Malha quadriculada leve" },
  { value: "dotted", label: "Pontilhado", hint: "Grade de pontos discreta" },
  { value: "paper", label: "Papel", hint: "Textura de papel com sombra" },
  { value: "accent", label: "Margem", hint: "Faixa colorida na lateral" },
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

export const NOTE_SIZE_OPTIONS: { value: NoteSize; label: string }[] = [
  { value: "sm", label: "Compacto" },
  { value: "md", label: "Padrão" },
  { value: "lg", label: "Confortável" },
];

export const NOTE_ALIGN_OPTIONS: { value: NoteAlign; label: string }[] = [
  { value: "left", label: "À esquerda" },
  { value: "center", label: "Centralizado" },
];

const KEY = "sticky-flow:note-appearance";
const PROJECT_KEY = "sticky-flow:note-appearance-projects";
const EVENT = "sticky-flow-note-appearance";

type Store = {
  account: NoteAppearance;
  projects: Record<string, NoteAppearance>;
};

function readAccount(): NoteAppearance {
  if (typeof window === "undefined") return defaultNoteAppearance;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaultNoteAppearance, ...JSON.parse(raw) } : defaultNoteAppearance;
  } catch {
    return defaultNoteAppearance;
  }
}

function readProjects(): Record<string, NoteAppearance> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROJECT_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Partial<NoteAppearance>>) : {};
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, { ...defaultNoteAppearance, ...v }]),
    );
  } catch {
    return {};
  }
}

function read(): Store {
  return { account: readAccount(), projects: readProjects() };
}

function broadcast(next: Store) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}

/**
 * Aparência das notas com herança: projeto (quando existir override) → conta.
 */
export function useNoteAppearance(projectId?: string | null) {
  const [store, setStore] = useState<Store>({ account: defaultNoteAppearance, projects: {} });

  useEffect(() => {
    setStore(read());
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Store>).detail;
      if (next) setStore(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === PROJECT_KEY) setStore(read());
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const projectOverride = projectId ? (store.projects[projectId] ?? null) : null;
  const appearance = projectOverride ?? store.account;

  const commit = useCallback((next: Store) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next.account));
      window.localStorage.setItem(PROJECT_KEY, JSON.stringify(next.projects));
    } catch {
      /* ignore */
    }
    setStore(next);
    broadcast(next);
  }, []);

  /** Atualiza o alvo atual: projeto (se tiver override) ou conta. */
  const update = useCallback(
    (patch: Partial<NoteAppearance>) => {
      const current = read();
      if (projectId && current.projects[projectId]) {
        commit({
          ...current,
          projects: { ...current.projects, [projectId]: { ...current.projects[projectId], ...patch } },
        });
      } else {
        commit({ ...current, account: { ...current.account, ...patch } });
      }
    },
    [commit, projectId],
  );

  const reset = useCallback(() => {
    const current = read();
    if (projectId && current.projects[projectId]) {
      commit({ ...current, projects: { ...current.projects, [projectId]: current.account } });
    } else {
      commit({ ...current, account: defaultNoteAppearance });
    }
  }, [commit, projectId]);

  /** Liga/desliga a personalização por projeto (ao ligar, copia o padrão da conta). */
  const setProjectOverride = useCallback(
    (enabled: boolean) => {
      if (!projectId) return;
      const current = read();
      const projects = { ...current.projects };
      if (enabled) projects[projectId] = { ...current.account };
      else delete projects[projectId];
      commit({ ...current, projects });
    },
    [commit, projectId],
  );

  return useMemo(
    () => ({
      appearance,
      accountAppearance: store.account,
      hasProjectOverride: Boolean(projectOverride),
      update,
      reset,
      setProjectOverride,
    }),
    [appearance, store.account, projectOverride, update, reset, setProjectOverride],
  );
}
