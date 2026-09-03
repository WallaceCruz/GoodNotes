import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSsrSafeStorage } from "@/lib/persist-storage";
import type { NativeColumnKey } from "@/lib/board-types";

/**
 * Aparência das notas, com herança projeto → conta.
 *
 * Antes cada card chamava um hook que lia duas chaves do `localStorage` e
 * mantinha sua própria cópia em `useState`, sincronizada entre instâncias por
 * um `CustomEvent` manual — com 100 notas na tela isso é 100 cópias do mesmo
 * objeto, 200 leituras de `localStorage` na montagem e 200 ouvintes. Um único
 * store resolve as três coisas de uma vez: fonte única, sem evento manual (o
 * próprio Zustand notifica os assinantes) e persistência pela mesma peça
 * (`persist`) que qualquer outro store deste app pode reusar.
 */

export type NoteStyle = "classic" | "soft" | "gradient" | "outline" | "glass" | "tape";
export type NotepadStyle = "plain" | "soft" | "outline" | "glass" | "accent" | "header";
export type NoteCorners = "sharp" | "soft" | "rounded" | "xl" | "pill" | "notched";
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
  nativeColumnColors: false,
  columnColors: DEFAULT_COLUMN_COLORS,
};

export const NOTE_STYLE_OPTIONS: { value: NoteStyle; label: string; hint: string }[] = [
  { value: "classic", label: "Clássica", hint: "Cor sólida com borda discreta" },
  { value: "soft", label: "Suave", hint: "Degradê discreto de cima para baixo" },
  { value: "gradient", label: "Degradê", hint: "Transição suave da cor" },
  { value: "outline", label: "Contorno", hint: "Fundo claro com borda colorida" },
  { value: "glass", label: "Vidro", hint: "Translúcida com desfoque" },
  { value: "tape", label: "Fita", hint: "Post-it com fita adesiva no topo" },
];

export const NOTEPAD_STYLE_OPTIONS: { value: NotepadStyle; label: string; hint: string }[] = [
  { value: "plain", label: "Limpo", hint: "Fundo sólido, sem textura" },
  { value: "soft", label: "Suave", hint: "Degradê muito discreto" },
  { value: "outline", label: "Contorno", hint: "Fundo neutro com borda colorida" },
  { value: "glass", label: "Vidro", hint: "Translúcido com desfoque" },
  { value: "accent", label: "Margem", hint: "Faixa colorida na lateral" },
  { value: "header", label: "Topo", hint: "Faixa colorida no topo" },
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

/** Completa um registro salvo com os campos que ele não tinha quando foi gravado. */
function withDefaults(partial: Partial<NoteAppearance> | undefined): NoteAppearance {
  return {
    ...defaultNoteAppearance,
    ...partial,
    columnColors: { ...DEFAULT_COLUMN_COLORS, ...(partial?.columnColors ?? {}) },
  };
}

type AppearanceState = {
  account: NoteAppearance;
  projects: Record<string, NoteAppearance>;
};

type AppearanceActions = {
  update: (projectId: string | null, patch: Partial<NoteAppearance>) => void;
  reset: (projectId: string | null) => void;
  setProjectOverride: (projectId: string, enabled: boolean) => void;
};

const STORAGE_KEY = "sticky-flow:note-appearance-v2";
const LEGACY_ACCOUNT_KEY = "sticky-flow:note-appearance";
const LEGACY_PROJECT_KEY = "sticky-flow:note-appearance-projects";

/**
 * Migra o formato anterior (duas chaves separadas) para a única chave que o
 * `persist` agora gerencia — só roda uma vez, antes do store hidratar, e só
 * quando a chave nova ainda não existe.
 */
function migrateLegacyStorage() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;
  const rawAccount = window.localStorage.getItem(LEGACY_ACCOUNT_KEY);
  const rawProjects = window.localStorage.getItem(LEGACY_PROJECT_KEY);
  if (!rawAccount && !rawProjects) return;
  try {
    const account = rawAccount ? (JSON.parse(rawAccount) as Partial<NoteAppearance>) : undefined;
    const projectsRaw = rawProjects
      ? (JSON.parse(rawProjects) as Record<string, Partial<NoteAppearance>>)
      : {};
    const state: AppearanceState = {
      account: withDefaults(account),
      projects: Object.fromEntries(
        Object.entries(projectsRaw).map(([id, v]) => [id, withDefaults(v)]),
      ),
    };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state, version: 0 }),
    );
    window.localStorage.removeItem(LEGACY_ACCOUNT_KEY);
    window.localStorage.removeItem(LEGACY_PROJECT_KEY);
  } catch {
    /* dado antigo corrompido: segue com os padrões, sem propagar o erro */
  }
}

migrateLegacyStorage();

const useAppearanceStore = create<AppearanceState & { actions: AppearanceActions }>()(
  persist(
    (set) => ({
      account: defaultNoteAppearance,
      projects: {},
      actions: {
        update: (projectId, patch) =>
          set((s) => {
            if (projectId && s.projects[projectId]) {
              return {
                projects: {
                  ...s.projects,
                  [projectId]: { ...s.projects[projectId], ...patch },
                },
              };
            }
            return { account: { ...s.account, ...patch } };
          }),
        reset: (projectId) =>
          set((s) =>
            projectId && s.projects[projectId]
              ? { projects: { ...s.projects, [projectId]: s.account } }
              : { account: defaultNoteAppearance },
          ),
        setProjectOverride: (projectId, enabled) =>
          set((s) => {
            const projects = { ...s.projects };
            if (enabled) projects[projectId] = { ...s.account };
            else delete projects[projectId];
            return { projects };
          }),
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => createSsrSafeStorage("aparência")),
      partialize: (s) => ({ account: s.account, projects: s.projects }),
      // O app faz SSR: hidratar aqui seria síncrono e já traria o dado real do
      // navegador antes do primeiro render — divergindo do HTML do servidor
      // (que só conhece o padrão). Adiar para um `useEffect` explícito
      // (`hydrateNoteAppearance`) é o mesmo padrão que o resto do app usa para
      // isto (compare com `hydrate()` em `stores/board.ts`).
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppearanceState>;
        return {
          ...current,
          account: withDefaults(p.account),
          projects: Object.fromEntries(
            Object.entries(p.projects ?? {}).map(([id, v]) => [id, withDefaults(v)]),
          ),
        };
      },
    },
  ),
);

/** Referência estável: importar não assina o store nem provoca re-render. */
export const appearanceActions = useAppearanceStore.getState().actions;

/**
 * Lê o `localStorage` e aplica ao store. Chamar de um `useEffect` de nível
 * de rota (nunca do corpo do componente) — assim como `boardActions.hydrate`,
 * é o que mantém o primeiro render do cliente idêntico ao HTML do servidor.
 * Chamar mais de uma vez é seguro (só relê o mesmo armazenamento).
 */
export function hydrateNoteAppearance() {
  void useAppearanceStore.persist.rehydrate();
}

/**
 * Aparência efetiva do projeto (com fallback pro padrão da conta), mais os
 * controles para editá-la. Mesma forma que o hook antigo tinha, então os
 * pontos de chamada não precisaram mudar — só o import.
 */
export function useNoteAppearance(projectId?: string | null) {
  const account = useAppearanceStore((s) => s.account);
  const projectOverride = useAppearanceStore((s) => (projectId ? (s.projects[projectId] ?? null) : null));
  const actions = useAppearanceStore((s) => s.actions);

  return {
    appearance: projectOverride ?? account,
    hasProjectOverride: Boolean(projectOverride),
    update: (patch: Partial<NoteAppearance>) => actions.update(projectId ?? null, patch),
    reset: () => actions.reset(projectId ?? null),
    setProjectOverride: (enabled: boolean) => {
      if (projectId) actions.setProjectOverride(projectId, enabled);
    },
  };
}
