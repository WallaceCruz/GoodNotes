import { useCallback, useEffect, useState } from "react";

export type Workspace = { id: string; name: string; emoji: string };

const KEY = "sticky-workspaces-v1";
const ACTIVE_KEY = "sticky-workspace-active-v1";

const DEFAULT: Workspace[] = [{ id: "ws_default", name: "Meu Workspace", emoji: "🗂️" }];

function read(): Workspace[] {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Workspace[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Workspaces do usuário (persistidos localmente, sincronizados entre abas). */
export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT);
  const [activeId, setActiveId] = useState<string>(DEFAULT[0]!.id);

  useEffect(() => {
    const load = () => {
      const list = read();
      setWorkspaces(list);
      const saved = localStorage.getItem(ACTIVE_KEY);
      setActiveId(list.some((w) => w.id === saved) ? saved! : list[0]!.id);
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === ACTIVE_KEY) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: Workspace[]) => {
    setWorkspaces(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const selectWorkspace = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  const addWorkspace = useCallback(
    (name: string, emoji = "🗂️") => {
      const clean = name.trim() || "Novo workspace";
      const ws: Workspace = { id: `ws_${Math.random().toString(36).slice(2, 8)}`, name: clean, emoji };
      persist([...read(), ws]);
      selectWorkspace(ws.id);
      return ws;
    },
    [persist, selectWorkspace],
  );

  const renameWorkspace = useCallback(
    (id: string, name: string) => persist(read().map((w) => (w.id === id ? { ...w, name } : w))),
    [persist],
  );

  const removeWorkspace = useCallback(
    (id: string) => {
      const next = read().filter((w) => w.id !== id);
      const list = next.length > 0 ? next : DEFAULT;
      persist(list);
      selectWorkspace(list[0]!.id);
    },
    [persist, selectWorkspace],
  );

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0]!;

  return { workspaces, active, selectWorkspace, addWorkspace, renameWorkspace, removeWorkspace };
}
