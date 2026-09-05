import { Filter, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  NOTE_COLORS,
  PRIORITIES,
  PRIORITY_ICON,
  PRIORITY_LABEL,
  type NoteColor,
  type Priority,
} from "@/lib/board/model";
import { activeFilterCount, emptyFilters, type Filters } from "@/lib/board/filters";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel, priorityClass } from "@/components/note/note-style";
import { PriorityChip } from "@/components/note/PrioritySelect";
import { TagManager } from "@/components/note/tag/TagManager";
import { useState } from "react";
import { boardActions, useFileTags } from "@/stores/board";
import { tagColorOf } from "@/lib/board/tags";

export function FiltersMenu({
  filters,
  allTags,
  compact = false,
  onChange,
}: {
  filters: Filters;
  allTags: string[];
  /** Alvo redondo só com ícone, do tamanho dos vizinhos no cabeçalho do celular. */
  compact?: boolean;
  onChange: (f: Filters) => void;
}) {
  const count = activeFilterCount(filters);
  const [managing, setManaging] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const tagDefs = useFileTags();

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Filtros"
          title="Filtros"
          className={cn(
            "relative flex items-center text-muted-foreground hover:bg-accent",
            compact
              ? "h-10 w-10 shrink-0 justify-center rounded-full"
              : "gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs",
            count > 0 &&
              (compact
                ? "bg-primary/10 text-foreground"
                : "border-primary/50 bg-primary/10 text-foreground"),
          )}
        >
          <Filter className={compact ? "h-[18px] w-[18px]" : "h-4 w-4"} />
          {!compact && "Filtros"}
          {count > 0 && (
            <span
              className={cn(
                "flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground",
                compact ? "absolute -right-0.5 -top-0.5" : "ml-0.5",
              )}
            >
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Filtros</p>
          {count > 0 && (
            <button
              onClick={() => onChange(emptyFilters)}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>

        <div className="scroll-thin max-h-[70vh] space-y-4 overflow-y-auto p-3">
          <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              placeholder="Buscar notas"
              aria-label="Buscar notas"
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>

          <section>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Cores
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Filtrar por cor ${noteLabel[c]}`}
                  title={noteLabel[c]}
                  onClick={() => toggleColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full border border-border transition",
                    noteBg[c],
                    filters.colors.includes(c) &&
                      "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                  )}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Prioridades
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <PriorityChip
                  key={p}
                  priority={p}
                  size="sm"
                  active={filters.priorities.includes(p)}
                  onClick={() => togglePriority(p)}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </p>
              <button
                onClick={() => setManaging((v) => !v)}
                className="rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
              >
                {managing ? "Concluir" : "Gerenciar"}
              </button>
            </div>

            {managing ? (
              <div className="rounded-md border border-border">
                <TagManager
                  selected={filters.tags}
                  onToggle={toggleTag}
                  query={tagQuery}
                  setQuery={setTagQuery}
                  onCreate={(color) => {
                    const name = tagQuery.trim().toLowerCase();
                    if (!name) return;
                    boardActions.addTag(name, color);
                    setTagQuery("");
                  }}
                  filtered={tagDefs
                    .filter((d) => d.name.includes(tagQuery.trim().toLowerCase()))
                    .map((d) => d.name)}
                  canCreate={
                    !!tagQuery.trim() &&
                    !tagDefs.some((d) => d.name === tagQuery.trim().toLowerCase())
                  }
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-full border border-foreground/10 px-2 py-0.5 text-[11px] text-foreground/80",
                      noteBg[tagColorOf(tagDefs, t)],
                      filters.tags.includes(t) &&
                        "ring-2 ring-ring ring-offset-1 ring-offset-popover",
                    )}
                  >
                    #{t}
                  </button>
                ))}
                {allTags.length === 0 && (
                  <span className="text-[11px] text-muted-foreground">Sem tags ainda</span>
                )}
              </div>
            )}
          </section>

          <label className="flex cursor-pointer items-center justify-between rounded-md border border-border px-2.5 py-2 text-xs">
            <span>Mostrar arquivadas</span>
            <input
              type="checkbox"
              checked={filters.showArchived}
              onChange={(e) => onChange({ ...filters, showArchived: e.target.checked })}
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}
