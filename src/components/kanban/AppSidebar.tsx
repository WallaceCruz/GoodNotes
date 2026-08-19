import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Folder,
  FolderOpen,
  Home,
  Inbox,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BoardStore } from "@/hooks/useBoardStore";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";


const ICON = "h-[18px] w-[18px] shrink-0";
const ROW =
  "group flex min-h-9 w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors";
const ACTION =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100";

function NameTooltip({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-64 break-words">
        {name || "Sem nome"}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar({
  store,
  collapsed,
  onToggleCollapsed,
  inboxOpen,
  onToggleInbox,
  onGoHome,
  archivedView,
  onToggleArchivedView,
  calendarView,
  onToggleCalendarView,
}: {
  store: BoardStore;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  inboxOpen: boolean;
  onToggleInbox: () => void;
  onGoHome: () => void;
  archivedView: boolean;
  onToggleArchivedView: () => void;
  calendarView: boolean;
  onToggleCalendarView: () => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [teamsOpen, setTeamsOpen] = useState(true);
  const ws = useWorkspaces();
  const teams = useTeams();
  const showArchived = archivedView;
  const isOpen = (id: string) => open[id] ?? true;
  const projects = store.state.projects.filter((p) => showArchived || !p.archived);


  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-3">
        <button
          onClick={onToggleCollapsed}
          aria-label="Expandir menu lateral"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <PanelLeftOpen className={ICON} />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className={ICON} />
        </span>
        <button
          onClick={onGoHome}
          aria-label="Home (kanban)"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            !archivedView && !calendarView && "bg-sidebar-accent text-foreground",
          )}
        >
          <Home className={ICON} />
        </button>
        <button
          onClick={onToggleInbox}
          aria-label={inboxOpen ? "Recolher inbox" : "Expandir inbox"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            inboxOpen && "bg-sidebar-accent text-foreground",
          )}
        >
          <Inbox className={ICON} />
        </button>
        <button
          onClick={onToggleCalendarView}
          aria-label="Calendário"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            calendarView && "bg-sidebar-accent text-foreground",
          )}
        >
          <CalendarDays className={ICON} />
        </button>
        <button
          onClick={onToggleArchivedView}
          aria-label="Arquivados"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            archivedView && "bg-sidebar-accent text-foreground",
          )}
        >
          <Archive className={ICON} />
        </button>
        <Folder className={cn(ICON, "text-muted-foreground")} />
        <div className="mt-auto">
          <UserMenu />
        </div>
      </aside>
    );
  }

  return (
    <TooltipProvider>
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-sidebar-accent">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-base text-primary-foreground">
                  {ws.active.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {ws.active.name}
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {ws.workspaces.map((w) => (
                <DropdownMenuItem key={w.id} onClick={() => ws.selectWorkspace(w.id)}>
                  <span>{w.emoji}</span>
                  <span className="flex-1 truncate">{w.name}</span>
                  {w.id === ws.active.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const name = window.prompt("Nome do workspace", "Novo workspace");
                  if (name !== null) ws.addWorkspace(name);
                }}
              >
                <Plus className="h-4 w-4" />
                Novo workspace
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const name = window.prompt("Renomear workspace", ws.active.name);
                  if (name?.trim()) ws.renameWorkspace(ws.active.id, name.trim());
                }}
              >
                <Pencil className="h-4 w-4" />
                Renomear atual
              </DropdownMenuItem>
              {ws.workspaces.length > 1 && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => ws.removeWorkspace(ws.active.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir atual
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={onToggleCollapsed}
            aria-label="Recolher menu lateral"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>


        <nav className="space-y-0.5 px-2">
          <button
            onClick={onGoHome}
            className={cn(
              ROW,
              "text-sidebar-foreground hover:bg-sidebar-accent",
              !archivedView && !calendarView && "bg-sidebar-accent font-medium text-foreground",
            )}
          >
            <Home className={cn(ICON, "text-muted-foreground")} />
            Home
          </button>
          <button
            onClick={onToggleInbox}
            className={cn(
              ROW,
              "text-sidebar-foreground hover:bg-sidebar-accent",
              inboxOpen && "bg-sidebar-accent font-medium text-foreground",
            )}
          >
            <Inbox className={cn(ICON, "text-muted-foreground")} />
            Inbox
            <span className="ml-auto text-[11px] text-muted-foreground">
              {inboxOpen ? "Ocultar" : "Mostrar"}
            </span>
          </button>
          <button
            onClick={onToggleCalendarView}
            className={cn(
              ROW,
              "text-sidebar-foreground hover:bg-sidebar-accent",
              calendarView && "bg-sidebar-accent font-medium text-foreground",
            )}
          >
            <CalendarDays className={cn(ICON, "text-muted-foreground")} />
            Calendário
          </button>
          <button
            onClick={onToggleArchivedView}
            className={cn(
              ROW,
              "text-sidebar-foreground hover:bg-sidebar-accent",
              showArchived && "bg-sidebar-accent font-medium text-foreground",
            )}
          >
            <Archive className={cn(ICON, "text-muted-foreground")} />
            Arquivados
          </button>
        </nav>

        <div className="mt-5 flex items-center justify-between px-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Meus projetos
          </span>
          <button
            onClick={store.addProject}
            aria-label="Adicionar projeto"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="scroll-thin mt-1 flex-1 overflow-y-auto px-2 pb-4">
          {projects.map((p) => {
            const expanded = isOpen(p.id);
            const hasActiveFile = p.files.some((f) => store.file?.id === f.id);
            return (
              <div key={p.id} className={cn("mt-0.5", p.archived && "opacity-60")}>
                <div
                  className={cn(
                    ROW,
                    "hover:bg-sidebar-accent/70",
                    hasActiveFile && "bg-sidebar-accent/40",
                  )}
                >
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [p.id]: !expanded }))}
                    aria-label={expanded ? "Recolher projeto" : "Expandir projeto"}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expanded ? (
                    <FolderOpen className={cn(ICON, "text-muted-foreground")} />
                  ) : (
                    <Folder className={cn(ICON, "text-muted-foreground")} />
                  )}
                  <NameTooltip name={p.name}>
                    <input
                      value={p.name}
                      onChange={(e) => store.renameProject(p.id, e.target.value)}
                      title={p.name}
                      className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium outline-none"
                    />
                  </NameTooltip>
                  <button
                    onClick={() => store.addFile(p.id)}
                    aria-label="Adicionar arquivo"
                    className={ACTION}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => store.setProjectArchived(p.id, !p.archived)}
                    aria-label={p.archived ? "Restaurar projeto" : "Arquivar projeto"}
                    className={ACTION}
                  >
                    {p.archived ? (
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    ) : (
                      <Archive className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => store.removeProject(p.id)}
                    aria-label="Excluir projeto"
                    className={ACTION}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {expanded &&
                  p.files
                    .filter((f) => showArchived || !f.archived)
                    .map((f) => {
                      const selected = store.file?.id === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => store.selectFile(p.id, f.id)}
                          className={cn(
                            ROW,
                            "relative ml-6 w-[calc(100%-1.5rem)] cursor-pointer hover:bg-sidebar-accent/70",
                            selected &&
                              "bg-sidebar-accent font-medium text-foreground before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary",
                            f.archived && "opacity-60",
                          )}
                        >
                          <FileText
                            className={cn(
                              ICON,
                              selected ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                          <NameTooltip name={f.name}>
                            <input
                              value={f.name}
                              onChange={(e) => store.renameFile(p.id, f.id, e.target.value)}
                              title={f.name}
                              className="min-w-0 flex-1 truncate bg-transparent outline-none"
                            />
                          </NameTooltip>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              store.setFileArchived(p.id, f.id, !f.archived);
                            }}
                            aria-label={f.archived ? "Restaurar arquivo" : "Arquivar arquivo"}
                            className={ACTION}
                          >
                            {f.archived ? (
                              <ArchiveRestore className="h-3.5 w-3.5" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              store.removeFile(p.id, f.id);
                            }}
                            aria-label="Excluir arquivo"
                            className={ACTION}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border p-2">
          <UserMenu variant="full" className="w-full" />
        </div>
      </aside>
    </TooltipProvider>
  );
}
