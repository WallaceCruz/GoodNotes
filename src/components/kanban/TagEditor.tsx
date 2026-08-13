import { Check, Plus, Tag as TagIcon, X } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BoardStore } from "@/hooks/useBoardStore";
import { NOTE_COLORS, tagColorOf, type NoteColor } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "./note-style";

export function TagEditor({
  tags,
  onChange,
  store,
  size = "sm",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  store: BoardStore;
  size?: "sm" | "md";
}) {
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<NoteColor>("sky");
  const defs = store.file?.tags ?? [];
  const text = size === "sm" ? "text-[10px]" : "text-[11px]";

  const toggle = (name: string) =>
    onChange(tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name]);

  const create = () => {
    const name = query.trim().toLowerCase();
    if (!name) return;
    store.addTag(name, color);
    if (!tags.includes(name)) onChange([...tags, name]);
    setQuery("");
  };

  const filtered = defs.filter((d) => d.name.includes(query.trim().toLowerCase()));
  const exact = defs.some((d) => d.name === query.trim().toLowerCase());

  return (
    <div className="flex flex-wrap items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
      {tags.map((t) => (
        <span
          key={t}
          className={cn(
            "group/tag flex items-center gap-1 rounded-full border border-foreground/10 px-2 py-0.5 text-foreground/80",
            noteBg[tagColorOf(defs, t)],
            text,
          )}
        >
          #{t}
          <button
            aria-label={`Remover tag ${t}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(tags.filter((x) => x !== t));
            }}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <button
            aria-label="Gerenciar tags"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-0.5 rounded-full border border-dashed border-foreground/25 px-1.5 py-0.5 text-foreground/50 hover:bg-foreground/5",
              text,
            )}
          >
            <Plus className="h-2.5 w-2.5" />
            tag
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0" onClick={(e) => e.stopPropagation()}>
          <TagManager
            store={store}
            selected={tags}
            onToggle={toggle}
            query={query}
            setQuery={setQuery}
            color={color}
            setColor={setColor}
            onCreate={create}
            filtered={filtered.map((d) => d.name)}
            canCreate={!!query.trim() && !exact}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Lista de tags com seleção, criação, renomeação e escolha de cor. */
export function TagManager({
  store,
  selected,
  onToggle,
  query,
  setQuery,
  color,
  setColor,
  onCreate,
  filtered,
  canCreate,
}: {
  store: BoardStore;
  selected: string[];
  onToggle: (name: string) => void;
  query: string;
  setQuery: (v: string) => void;
  color: NoteColor;
  setColor: (c: NoteColor) => void;
  onCreate: () => void;
  filtered: string[];
  canCreate: boolean;
}) {
  const defs = store.file?.tags ?? [];
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="p-2">
      <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
        <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canCreate) onCreate();
          }}
          placeholder="Buscar ou criar tag"
          aria-label="Buscar ou criar tag"
          className="w-full bg-transparent text-xs outline-none"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {NOTE_COLORS.map((c) => (
          <button
            key={c}
            aria-label={`Cor da tag ${noteLabel[c]}`}
            title={noteLabel[c]}
            onClick={() => setColor(c)}
            className={cn(
              "h-4 w-4 rounded-full border border-border",
              noteBg[c],
              color === c && "ring-2 ring-ring ring-offset-1 ring-offset-popover",
            )}
          />
        ))}
        {canCreate && (
          <button
            onClick={onCreate}
            className="ml-auto flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
          >
            <Plus className="h-3 w-3" />
            Criar "{query.trim().toLowerCase()}"
          </button>
        )}
      </div>

      <div className="scroll-thin mt-2 max-h-56 space-y-0.5 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-1 py-2 text-[11px] text-muted-foreground">Nenhuma tag ainda.</p>
        )}
        {filtered.map((name) => {
          const tagColor = defs.find((d) => d.name === name)?.color ?? "slate";
          const isEditing = editing === name;
          return (
            <div key={name} className="flex items-center gap-1 rounded-md px-1 py-1 hover:bg-accent">
              <button
                aria-label={`Selecionar ${name}`}
                onClick={() => onToggle(name)}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border"
              >
                {selected.includes(name) && <Check className="h-3 w-3" />}
              </button>

              {isEditing ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    store.renameTag(name, draft);
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      store.renameTag(name, draft);
                      setEditing(null);
                    }
                    if (e.key === "Escape") setEditing(null);
                  }}
                  aria-label={`Renomear tag ${name}`}
                  className="min-w-0 flex-1 rounded border border-border bg-background px-1 text-[11px] outline-none"
                />
              ) : (
                <button
                  onDoubleClick={() => {
                    setEditing(name);
                    setDraft(name);
                  }}
                  onClick={() => onToggle(name)}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-full border border-foreground/10 px-2 py-0.5 text-left text-[11px]",
                    noteBg[tagColor],
                  )}
                  title="Duplo clique para renomear"
                >
                  #{name}
                </button>
              )}

              <div className="flex shrink-0 items-center gap-0.5">
                {NOTE_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    aria-label={`Cor ${noteLabel[c]} para ${name}`}
                    onClick={() => store.setTagColor(name, c)}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full border border-border",
                      noteBg[c],
                      tagColor === c && "ring-1 ring-ring",
                    )}
                  />
                ))}
                <button
                  aria-label={`Excluir tag ${name}`}
                  onClick={() => store.removeTag(name)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
