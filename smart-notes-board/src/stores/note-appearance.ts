import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSsrSafeStorage } from "@/lib/persist-storage";
import {
  DEFAULT_COLUMN_COLORS,
  defaultNoteAppearance,
  type NoteAppearance,
} from "@/lib/note-appearance";

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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version: 0 }));
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
  const projectOverride = useAppearanceStore((s) =>
    projectId ? (s.projects[projectId] ?? null) : null,
  );
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
