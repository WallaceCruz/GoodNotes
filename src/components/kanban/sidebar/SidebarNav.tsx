import { Archive, CalendarDays, GanttChartSquare, Home, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON, ROW } from "./sidebar-ui";
import type { BoardView } from "../board-view";

const VIEWS: Array<{ view: BoardView; label: string; icon: LucideIcon }> = [
  { view: "kanban", label: "Home", icon: Home },
  { view: "timeline", label: "Linha do tempo", icon: GanttChartSquare },
  { view: "calendar", label: "Calendário", icon: CalendarDays },
  { view: "archived", label: "Arquivados", icon: Archive },
];

/** Navegação principal: as visões do quadro e o atalho do inbox. */
export function SidebarNav({
  view,
  onSelectView,
  inboxOpen,
  onToggleInbox,
}: {
  view: BoardView;
  onSelectView: (view: BoardView) => void;
  inboxOpen: boolean;
  onToggleInbox: () => void;
}) {
  return (
    <nav className="space-y-0.5 px-2">
      {VIEWS.map(({ view: target, label, icon: Icon }) => (
        <button
          key={target}
          onClick={() => onSelectView(target)}
          className={cn(
            ROW,
            "text-sidebar-foreground hover:bg-sidebar-accent",
            view === target && "bg-sidebar-accent font-medium text-foreground",
          )}
        >
          <Icon className={cn(ICON, "text-muted-foreground")} />
          {label}
        </button>
      ))}

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
    </nav>
  );
}
