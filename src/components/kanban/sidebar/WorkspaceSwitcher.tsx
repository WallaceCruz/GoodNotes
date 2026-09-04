import { Check, ChevronsUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaces } from "@/hooks/useWorkspaces";

/** Troca, cria, renomeia e remove workspaces. */
export function WorkspaceSwitcher() {
  const { workspaces, active, selectWorkspace, addWorkspace, renameWorkspace, removeWorkspace } =
    useWorkspaces();

  return (
    <div className="px-3 pb-2 pt-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full min-w-0 items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-sidebar-accent">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sm">
              {active.emoji}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{active.name}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem key={workspace.id} onClick={() => selectWorkspace(workspace.id)}>
              <span>{workspace.emoji}</span>
              <span className="flex-1 truncate">{workspace.name}</span>
              {workspace.id === active.id && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              const name = window.prompt("Nome do workspace", "Novo workspace");
              if (name !== null) addWorkspace(name);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo workspace
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const name = window.prompt("Renomear workspace", active.name);
              if (name?.trim()) renameWorkspace(active.id, name.trim());
            }}
          >
            <Pencil className="h-4 w-4" />
            Renomear atual
          </DropdownMenuItem>
          {/* Sem workspace nenhum o app não tem onde guardar projeto. */}
          {workspaces.length > 1 && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => removeWorkspace(active.id)}
            >
              <Trash2 className="h-4 w-4" />
              Excluir atual
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
