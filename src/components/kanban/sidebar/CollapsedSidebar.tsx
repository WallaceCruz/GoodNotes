import {
  Archive,
  CalendarDays,
  Folder,
  GanttChartSquare,
  Home,
  Inbox,
  PanelLeftOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "../BrandLogo";
import { UserMenu } from "../UserMenu";
import { ICON } from "./sidebar-ui";
import type { BoardView } from "../board-view";

const RAIL_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground";

const VIEWS: Array<{ view: BoardView; label: string; icon: LucideIcon }> = [
  { view: "kanban", label: "Home (kanban)", icon: Home },
  { view: "timeline", label: "Linha do tempo", icon: GanttChartSquare },
  { view: "calendar", label: "Calendário", icon: CalendarDays },
  { view: "archived", label: "Arquivados", icon: Archive },
];

/** Versão em trilho: só os ícones, para dar espaço ao quadro. */
export function CollapsedSidebar({
  view,
  onSelectView,
  inboxOpen,
  onToggleInbox,
  onExpand,
}: {
  view: BoardView;
  onSelectView: (view: BoardView) => void;
  inboxOpen: boolean;
  onToggleInbox: () => void;
  onExpand: () => void;
}) {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-3">
      <button onClick={onExpand} aria-label="Expandir menu lateral" className={RAIL_BUTTON}>
        <PanelLeftOpen className={ICON} />
      </button>

      <BrandLogo compact />

      {VIEWS.map(({ view: target, label, icon: Icon }) => (
        <button
          key={target}
          onClick={() => onSelectView(target)}
          aria-label={label}
          className={cn(RAIL_BUTTON, view === target && "bg-sidebar-accent text-foreground")}
        >
          <Icon className={ICON} />
        </button>
      ))}

      <button
        onClick={onToggleInbox}
        aria-label={inboxOpen ? "Recolher inbox" : "Expandir inbox"}
        className={cn(RAIL_BUTTON, inboxOpen && "bg-sidebar-accent text-foreground")}
      >
        <Inbox className={ICON} />
      </button>

      <Folder className={cn(ICON, "text-muted-foreground")} />

      <div className="mt-auto">
        <UserMenu />
      </div>
    </aside>
  );
}
