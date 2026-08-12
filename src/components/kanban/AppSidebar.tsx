import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Home,
  Inbox,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";


export function AppSidebar({
  store,
  collapsed,
  onToggleCollapsed,
  inboxOpen,
  onToggleInbox,
  onGoHome,
  archivedView,
  onToggleArchivedView,
}: {
  store: BoardStore;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  inboxOpen: boolean;
  onToggleInbox: () => void;
  onGoHome: () => void;
  archivedView: boolean;
  onToggleArchivedView: () => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const showArchived = archivedView;
  const isOpen = (id: string) => open[id] ?? true;
  const projects = store.state.projects.filter((p) => showArchived || !p.archived);

  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col items-center gap-3 border-r border-border bg-sidebar py-3">
        <button
          onClick={onToggleCollapsed}
          aria-label="Expandir menu lateral"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="h-4 w-4" />
        </span>
        <button
          onClick={onGoHome}
          aria-label="Home (kanban)"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent"
        >
          <Home className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleInbox}
          aria-label={inboxOpen ? "Recolher inbox" : "Expandir inbox"}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent",
            inboxOpen && "bg-sidebar-accent text-foreground",
          )}
        >
          <Inbox className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleArchivedView}
          aria-label="Arquivados"
          className={cn(
            "rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent",
            archivedView && "bg-sidebar-accent text-foreground",
          )}
        >
          <Archive className="h-4 w-4" />
        </button>
        <Folder className="h-4 w-4 text-muted-foreground" />
        <div className="mt-auto">
          <UserMenu />
        </div>
      </aside>
    );
  }


  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-3 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold">Sticky Flow</span>
        <button
          onClick={onToggleCollapsed}
          aria-label="Recolher menu lateral"
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <nav className="space-y-1 px-2">
        <button
          onClick={onGoHome}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
            !archivedView && "bg-sidebar-accent font-medium",
          )}
        >
          <Home className="h-4 w-4 text-muted-foreground" />
          Home
        </button>
        <button
          onClick={onToggleInbox}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
            inboxOpen && "bg-sidebar-accent font-medium",
          )}
        >
          <Inbox className="h-4 w-4 text-muted-foreground" />
          Inbox
          <span className="ml-auto text-[11px] text-muted-foreground">
            {inboxOpen ? "Ocultar" : "Mostrar"}
          </span>
        </button>
        <button
          onClick={onToggleArchivedView}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
            showArchived && "bg-sidebar-accent font-medium",
          )}
        >
          <Archive className="h-4 w-4 text-muted-foreground" />
          Arquivados
        </button>
      </nav>

      <div className="mt-6 flex items-center justify-between px-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Meus projetos
        </span>
        <button
          onClick={store.addProject}
          aria-label="Adicionar projeto"
          className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="scroll-thin mt-1 flex-1 overflow-y-auto px-2 pb-4">
        {projects.map((p) => (
          <div key={p.id} className={cn("mt-1", p.archived && "opacity-60")}>
            <div className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-sidebar-accent">
              <button
                onClick={() => setOpen((o) => ({ ...o, [p.id]: !isOpen(p.id) }))}
                aria-label="Expandir projeto"
                className="text-muted-foreground"
              >
                {isOpen(p.id) ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
              <Folder className="h-4 w-4 text-muted-foreground" />
              <input
                value={p.name}
                onChange={(e) => store.renameProject(p.id, e.target.value)}
                className="w-full bg-transparent text-sm font-medium outline-none"
              />
              <button
                onClick={() => store.addFile(p.id)}
                aria-label="Adicionar arquivo"
                className="opacity-0 group-hover:opacity-100"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => store.setProjectArchived(p.id, !p.archived)}
                aria-label={p.archived ? "Restaurar projeto" : "Arquivar projeto"}
                className="opacity-0 group-hover:opacity-100"
              >
                {p.archived ? (
                  <ArchiveRestore className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => store.removeProject(p.id)}
                aria-label="Excluir projeto"
                className="opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {isOpen(p.id) &&
              p.files
                .filter((f) => showArchived || !f.archived)
                .map((f) => (
                  <div
                    key={f.id}
                    onClick={() => store.selectFile(p.id, f.id)}
                    className={cn(
                      "group ml-6 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent",
                      store.file?.id === f.id && "bg-sidebar-accent font-medium",
                      f.archived && "opacity-60",
                    )}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={f.name}
                      onChange={(e) => store.renameFile(p.id, f.id, e.target.value)}
                      className="w-full bg-transparent outline-none"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        store.setFileArchived(p.id, f.id, !f.archived);
                      }}
                      aria-label={f.archived ? "Restaurar arquivo" : "Arquivar arquivo"}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      {f.archived ? (
                        <ArchiveRestore className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        store.removeFile(p.id, f.id);
                      }}
                      aria-label="Excluir arquivo"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
          </div>
        ))}
      </div>

      <div className="border-t border-border p-2">
        <UserMenu variant="full" className="w-full" />
      </div>
    </aside>
  );
}

