import { Search, X, Zap } from "lucide-react";
import {
  NOTE_COLORS,
  PRIORITIES,
  PRIORITY_ICON,
  PRIORITY_LABEL,
  type NoteColor,
  type Priority,
} from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel, priorityClass } from "./note-style";

export type Filters = {
  query: string;
  colors: NoteColor[];
  tags: string[];
  priorities: Priority[];
  showArchived: boolean;
};

export const emptyFilters: Filters = {
  query: "",
  colors: [],
  tags: [],
  priorities: [],
  showArchived: false,
};

export function BoardFilters({
  filters,
  allTags,
  onChange,
  automationsOpen,
  onToggleAutomations,
}: {
  filters: Filters;
  allTags: string[];
  onChange: (f: Filters) => void;
  automationsOpen: boolean;
  onToggleAutomations: () => void;
}) {
  const toggleColor = (c: NoteColor) =>
    onChange({
      ...filters,
      colors: filters.colors.includes(c)
        ? filters.colors.filter((x) => x !== c)
        : [...filters.colors, c],
    });

  const togglePriority = (p: Priority) =>
    onChange({
      ...filters,
      priorities: filters.priorities.includes(p)
        ? filters.priorities.filter((x) => x !== p)
        : [...filters.priorities, p],
    });

  const toggleTag = (t: string) =>
    onChange({
      ...filters,
      tags: filters.tags.includes(t) ? filters.tags.filter((x) => x !== t) : [...filters.tags, t],
    });

  const active =
    filters.query ||
    filters.colors.length > 0 ||
    filters.tags.length > 0 ||
    filters.priorities.length > 0 ||
    filters.showArchived;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/80 px-4 py-2">
      <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Buscar notas"
          aria-label="Buscar notas"
          className="w-40 bg-transparent text-xs outline-none"
        />
      </div>

      <div className="flex items-center gap-1">
        {NOTE_COLORS.map((c) => (
          <button
            key={c}
            aria-label={`Filtrar por cor ${noteLabel[c]}`}
            onClick={() => toggleColor(c)}
            className={cn(
              "h-5 w-5 rounded-full border border-border transition",
              noteBg[c],
              filters.colors.includes(c) && "ring-2 ring-ring ring-offset-1 ring-offset-background",
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => togglePriority(p)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px]",
              filters.priorities.includes(p)
                ? priorityClass[p]
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {allTags.map((t) => (
          <button
            key={t}
            onClick={() => toggleTag(t)}
            className={cn(
              "rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-accent",
              filters.tags.includes(t) && "border-primary bg-primary/10 text-foreground",
            )}
          >
            #{t}
          </button>
        ))}
        {allTags.length === 0 && (
          <span className="text-[11px] text-muted-foreground">Sem tags ainda</span>
        )}
      </div>

      <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.showArchived}
          onChange={(e) => onChange({ ...filters, showArchived: e.target.checked })}
        />
        Mostrar arquivadas
      </label>

      <button
        onClick={onToggleAutomations}
        className={cn(
          "ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent",
          automationsOpen && "bg-accent",
        )}
      >
        <Zap className="h-3 w-3" />
        Automações
      </button>

      {active && (
        <button
          onClick={() => onChange(emptyFilters)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
        >
          <X className="h-3 w-3" />
          Limpar filtros
        </button>
      )}
    </div>
  );
}
