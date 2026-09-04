import { useCallback } from "react";
import { useLocalStore } from "./useLocalStore";
import { uid } from "@/lib/id";

export type Workspace = { id: string; name: string; emoji: string };

const KEY = "sticky-workspaces-v1";
const ACTIVE_KEY = "sticky-workspace-active-v1";
const LABEL = "workspaces";

const DEFAULT: Workspace[] = [{ id: "ws_default", name: "Meu Workspace", emoji: "🗂️" }];

function parseWorkspaces(raw: unknown): Workspace[] | null {
  if (!Array.isArray(raw)) return null;
  const list = raw.filter(
    (w): w is Workspace =>
      !!w && typeof w.id === "string" && typeof w.name === "string" && typeof w.emoji === "string",
  );
  return list.length > 0 ? list : null;
}

const parseId = (raw: unknown) => (typeof raw === "string" ? raw : null);

/** Workspaces do usuário, persistidos localmente e sincronizados entre abas. */
export function useWorkspaces() {
  const { value: workspaces, setValue: setWorkspaces } = useLocalStore({
    key: KEY,
    fallback: DEFAULT,
    parse: parseWorkspaces,
    label: LABEL,
  });
  const { value: activeId, setValue: setActiveId } = useLocalStore({
    key: ACTIVE_KEY,
    fallback: DEFAULT[0]!.id,
    parse: parseId,
    label: LABEL,
  });

  const selectWorkspace = useCallback((id: string) => setActiveId(id), [setActiveId]);

  const addWorkspace = useCallback(
    (name: string, emoji = "🗂️") => {
      const workspace: Workspace = { id: uid("ws"), name: name.trim() || "Novo workspace", emoji };
      setWorkspaces((current) => [...current, workspace]);
      selectWorkspace(workspace.id);
      return workspace;
    },
    [setWorkspaces, selectWorkspace],
  );

  const renameWorkspace = useCallback(
    (id: string, name: string) =>
      setWorkspaces((current) => current.map((w) => (w.id === id ? { ...w, name } : w))),
    [setWorkspaces],
  );

  const removeWorkspace = useCallback(
    (id: string) => {
      let remaining = DEFAULT;
      setWorkspaces((current) => {
        const next = current.filter((w) => w.id !== id);
        remaining = next.length > 0 ? next : DEFAULT;
        return remaining;
      });
      selectWorkspace(remaining[0]!.id);
    },
    [setWorkspaces, selectWorkspace],
  );

  // O workspace ativo pode ter sido apagado em outra aba: cair no primeiro
  // mantém a tela coerente sem exigir recarregar.
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0]!;

  return { workspaces, active, selectWorkspace, addWorkspace, renameWorkspace, removeWorkspace };
}
