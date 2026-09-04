import { useState } from "react";
import { PanelLeftClose, Search, X } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandLogo } from "@/components/app/BrandLogo";
import { UserMenu } from "@/components/app/UserMenu";
import { CollapsedSidebar } from "./sidebar/CollapsedSidebar";
import { ProjectTree } from "./sidebar/ProjectTree";
import { SidebarNav } from "./sidebar/SidebarNav";
import { TeamsSection } from "./sidebar/TeamsSection";
import { WorkspaceSwitcher } from "./sidebar/WorkspaceSwitcher";
import type { BoardView } from "./board-view";

/**
 * Barra lateral do app.
 *
 * Aqui ficam só a moldura e a busca; cada seção (workspace, navegação, árvore
 * de projetos, times) é um componente que busca os próprios dados. Por isso a
 * barra recebe apenas o estado que a página realmente controla — qual visão
 * está aberta e se o inbox aparece — em vez de um booleano por tela.
 */
export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  inboxOpen,
  onToggleInbox,
  view,
  onSelectView,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  inboxOpen: boolean;
  onToggleInbox: () => void;
  view: BoardView;
  onSelectView: (view: BoardView) => void;
}) {
  const [query, setQuery] = useState("");

  if (collapsed) {
    return (
      <CollapsedSidebar
        view={view}
        onSelectView={onSelectView}
        inboxOpen={inboxOpen}
        onToggleInbox={onToggleInbox}
        onExpand={onToggleCollapsed}
      />
    );
  }

  return (
    <TooltipProvider>
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          <BrandLogo />
          <button
            onClick={onToggleCollapsed}
            aria-label="Recolher menu lateral"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <WorkspaceSwitcher />

        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-background px-2 py-1.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar projetos e arquivos"
              aria-label="Buscar projetos e arquivos"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <SidebarNav
          view={view}
          onSelectView={onSelectView}
          inboxOpen={inboxOpen}
          onToggleInbox={onToggleInbox}
        />

        <ProjectTree query={query} showArchived={view === "archived"} />

        <TeamsSection />

        <div className="border-t border-border p-2">
          <UserMenu variant="full" className="w-full" />
        </div>
      </aside>
    </TooltipProvider>
  );
}
