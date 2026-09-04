import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarViewMode } from "@/lib/board/calendar";
import { SNAP_OPTIONS, VIEW_LABEL, type CalendarFilters } from "./calendar-ui";

function FilterChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}

/** Cabeçalho do calendário: período, modo de visualização, filtros e navegação. */
export function CalendarToolbar({
  title,
  view,
  onChangeView,
  filters,
  onChangeFilters,
  snap,
  onChangeSnap,
  conflictCount,
  onCreateNote,
  onMove,
  onGoToday,
}: {
  title: string;
  view: CalendarViewMode;
  onChangeView: (view: CalendarViewMode) => void;
  filters: CalendarFilters;
  onChangeFilters: (filters: CalendarFilters) => void;
  snap: number;
  onChangeSnap: (snap: number) => void;
  conflictCount: number;
  onCreateNote: () => void;
  onMove: (delta: number) => void;
  onGoToday: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold capitalize">{title}</h2>

      <div className="ml-2 flex items-center gap-0.5 rounded-md border border-border p-0.5">
        {(Object.keys(VIEW_LABEL) as CalendarViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onChangeView(mode)}
            className={cn(
              "rounded px-2 py-1 text-[11px] transition-colors",
              view === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {VIEW_LABEL[mode]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <FilterChip
          label="Com prazo"
          active={filters.withDeadline}
          onToggle={() => onChangeFilters({ ...filters, withDeadline: !filters.withDeadline })}
        />
        <FilterChip
          label="Sem prazo"
          active={filters.withoutDeadline}
          onToggle={() =>
            onChangeFilters({ ...filters, withoutDeadline: !filters.withoutDeadline })
          }
        />
        <FilterChip
          label="Arquivadas"
          active={filters.archived}
          onToggle={() => onChangeFilters({ ...filters, archived: !filters.archived })}
        />
      </div>

      {/* Só as grades com hora têm onde encaixar o minuto. */}
      {view !== "month" && (
        <label className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
          Snap
          <select
            value={snap}
            onChange={(e) => onChangeSnap(Number(e.target.value))}
            aria-label="Intervalo de snap do horário"
            className="bg-transparent text-[11px] font-medium text-foreground outline-none"
          >
            {SNAP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} min
              </option>
            ))}
          </select>
        </label>
      )}

      {conflictCount > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/50 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive">
          <AlertTriangle className="h-3 w-3" />
          {conflictCount} conflito(s) de horário
        </span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onCreateNote}
          className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova nota neste dia
        </button>
        <button
          onClick={() => onMove(-1)}
          aria-label="Anterior"
          className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onGoToday}
          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          Hoje
        </button>
        <button
          onClick={() => onMove(1)}
          aria-label="Próximo"
          className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
