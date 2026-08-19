import { useCallback, useEffect, useState } from "react";

export type TeamMember = { id: string; name: string };
export type Team = { id: string; name: string; emoji: string; members: TeamMember[] };

const KEY = "sticky-teams-v1";

const DEFAULT: Team[] = [
  {
    id: "team_produto",
    name: "Produto",
    emoji: "🧩",
    members: [{ id: "m_1", name: "Você" }],
  },
];

function read(): Team[] {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Team[];
    return Array.isArray(parsed) ? parsed : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

/** Times do workspace (persistidos localmente, sincronizados entre abas). */
export function useTeams() {
  const [teams, setTeams] = useState<Team[]>(DEFAULT);

  useEffect(() => {
    const load = () => setTeams(read());
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: Team[]) => {
    setTeams(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const addTeam = useCallback(
    (name = "Novo time", emoji = "👥") => {
      const team: Team = { id: uid("team"), name, emoji, members: [] };
      persist([...read(), team]);
      return team;
    },
    [persist],
  );

  const renameTeam = useCallback(
    (id: string, name: string) => persist(read().map((t) => (t.id === id ? { ...t, name } : t))),
    [persist],
  );

  const removeTeam = useCallback(
    (id: string) => persist(read().filter((t) => t.id !== id)),
    [persist],
  );

  const addMember = useCallback(
    (teamId: string, name: string) => {
      const clean = name.trim();
      if (!clean) return;
      persist(
        read().map((t) =>
          t.id === teamId ? { ...t, members: [...t.members, { id: uid("m"), name: clean }] } : t,
        ),
      );
    },
    [persist],
  );

  const removeMember = useCallback(
    (teamId: string, memberId: string) =>
      persist(
        read().map((t) =>
          t.id === teamId ? { ...t, members: t.members.filter((m) => m.id !== memberId) } : t,
        ),
      ),
    [persist],
  );

  return { teams, addTeam, renameTeam, removeTeam, addMember, removeMember };
}
