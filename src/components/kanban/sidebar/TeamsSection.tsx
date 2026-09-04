import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, UserPlus, Users, X } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";
import { ACTION, ICON, NameTooltip, ROW } from "./sidebar-ui";

/** Times do workspace e seus membros. */
export function TeamsSection() {
  const [open, setOpen] = useState(true);
  const { teams, addTeam, renameTeam, removeTeam, addMember, removeMember } = useTeams();

  return (
    <div className="border-t border-border px-2 py-2">
      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          Times
        </button>
        <button
          onClick={() => addTeam()}
          aria-label="Adicionar time"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="scroll-thin mt-1 max-h-56 overflow-y-auto">
          {teams.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum time ainda.</p>
          )}

          {teams.map((team) => (
            <div key={team.id} className="mt-0.5">
              <div className={cn(ROW, "hover:bg-sidebar-accent/70")}>
                <Users className={cn(ICON, "text-muted-foreground")} />
                <NameTooltip name={team.name}>
                  <input
                    value={team.name}
                    onChange={(e) => renameTeam(team.id, e.target.value)}
                    title={team.name}
                    className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium outline-none"
                  />
                </NameTooltip>
                <button
                  onClick={() => {
                    const name = window.prompt("Nome do membro");
                    if (name) addMember(team.id, name);
                  }}
                  aria-label="Adicionar membro"
                  className={ACTION}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeTeam(team.id)}
                  aria-label="Excluir time"
                  className={ACTION}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {team.members.map((member) => (
                <div
                  key={member.id}
                  className={cn(ROW, "ml-6 w-[calc(100%-1.5rem)] hover:bg-sidebar-accent/70")}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {member.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{member.name}</span>
                  <button
                    onClick={() => removeMember(team.id, member.id)}
                    aria-label="Remover membro"
                    className={ACTION}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
