import { useCallback } from "react";
import { useLocalStore } from "./useLocalStore";
import { uid } from "@/lib/id";

export type TeamMember = { id: string; name: string };
export type Team = { id: string; name: string; emoji: string; members: TeamMember[] };

const KEY = "sticky-teams-v1";
const LABEL = "times";

const DEFAULT: Team[] = [
  { id: "team_produto", name: "Produto", emoji: "🧩", members: [{ id: "m_1", name: "Você" }] },
];

function parseTeams(raw: unknown): Team[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter((t): t is Team => !!t && typeof t.id === "string" && typeof t.name === "string")
    .map((t) => ({ ...t, emoji: t.emoji ?? "👥", members: t.members ?? [] }));
}

/** Times do workspace, persistidos localmente e sincronizados entre abas. */
export function useTeams() {
  const { value: teams, setValue: setTeams } = useLocalStore({
    key: KEY,
    fallback: DEFAULT,
    parse: parseTeams,
    label: LABEL,
  });

  const mapTeam = useCallback(
    (teamId: string, change: (team: Team) => Team) =>
      setTeams((current) => current.map((t) => (t.id === teamId ? change(t) : t))),
    [setTeams],
  );

  const addTeam = useCallback(
    (name = "Novo time", emoji = "👥") => {
      const team: Team = { id: uid("team"), name, emoji, members: [] };
      setTeams((current) => [...current, team]);
      return team;
    },
    [setTeams],
  );

  const renameTeam = useCallback(
    (id: string, name: string) => mapTeam(id, (t) => ({ ...t, name })),
    [mapTeam],
  );

  const removeTeam = useCallback(
    (id: string) => setTeams((current) => current.filter((t) => t.id !== id)),
    [setTeams],
  );

  const addMember = useCallback(
    (teamId: string, name: string) => {
      const clean = name.trim();
      if (!clean) return;
      mapTeam(teamId, (t) => ({ ...t, members: [...t.members, { id: uid("m"), name: clean }] }));
    },
    [mapTeam],
  );

  const removeMember = useCallback(
    (teamId: string, memberId: string) =>
      mapTeam(teamId, (t) => ({ ...t, members: t.members.filter((m) => m.id !== memberId) })),
    [mapTeam],
  );

  return { teams, addTeam, renameTeam, removeTeam, addMember, removeMember };
}
