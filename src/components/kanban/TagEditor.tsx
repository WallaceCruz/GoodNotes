import { Check, Palette, Pencil, Plus, Search, Tag as TagIcon, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BoardStore } from "@/hooks/useBoardStore";
import { NOTE_COLORS, tagColorOf, type NoteColor } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "./note-style";

/** Cor automática estável a partir do nome, evitando escolher cor antes de criar. */
function autoColor(name: string): NoteColor {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return NOTE_COLORS[h % NOTE_COLORS.length] ?? "sky";
}

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
            className="opacity-50 transition hover:opacity-100"
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
              "flex items-center gap-0.5 rounded-full border border-dashed border-foreground/25 px-1.5 py-0.5 text-foreground/50 transition hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground/80",
              text,
            )}
          >
            <Plus className="h-2.5 w-2.5" />
            tag
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[19rem] p-0" onClick={(e) => e.stopPropagation()}>
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

function ColorPicker({
  value,
  onPick,
  label,
}: {
  value: NoteColor;
  onPick: (c: NoteColor) => void;
  label: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={label}
          title={label}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Palette className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-6 gap-1.5">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              aria-label={noteLabel[c]}
              title={noteLabel[c]}
              onClick={() => onPick(c)}
              className={cn(
                "h-5 w-5 rounded-full border border-border transition hover:scale-110",
                noteBg[c],
                value === c && "ring-2 ring-ring ring-offset-1 ring-offset-popover",
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Lista de tags com seleção, criação rápida, renomeação e cor por tag. */
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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const term = query.trim().toLowerCase();
  const suggested = useMemo(() => (term ? autoColor(term) : color), [term, color]);

  // Criar já usando a cor sugerida automaticamente (sem exigir escolha prévia).
  const quickCreate = () => {
    if (!canCreate) return;
    setColor(suggested);
    onCreate();
  };

  const ordered = useMemo(
    () => [...filtered].sort((a, b) => Number(selected.includes(b)) - Number(selected.includes(a))),
    [filtered, selected],
  );

  return (
    <div className="flex flex-col">
      {/* Busca / criação */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (canCreate) quickCreate();
              else if (ordered[0]) onToggle(ordered[0]);
            }
            if (e.key === "Escape" && query) {
              e.preventDefault();
              setQuery("");
            }
          }}
          placeholder="Buscar ou criar tag…"
          aria-label="Buscar ou criar tag"
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            aria-label="Limpar busca"
            onClick={() => setQuery("")}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Selecionadas */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
          {selected.map((name) => (
            <button
              key={name}
              onClick={() => onToggle(name)}
              aria-label={`Remover ${name}`}
              className={cn(
                "flex items-center gap-1 rounded-full border border-foreground/10 px-2 py-0.5 text-[11px] text-foreground/80 transition hover:opacity-80",
                noteBg[tagColorOf(defs, name)],
              )}
            >
              #{name}
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
        </div>
      )}

      {/* Criação rápida */}
      {canCreate && (
        <button
          onClick={quickCreate}
          className="flex items-center gap-2 border-b border-border px-3 py-2 text-left text-xs transition hover:bg-accent"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Plus className="h-3 w-3" />
          </span>
          <span className="min-w-0 flex-1 truncate">
            Criar{" "}
            <span
              className={cn(
                "rounded-full border border-foreground/10 px-1.5 py-0.5 text-[11px]",
                noteBg[suggested],
              )}
            >
              #{term}
            </span>
          </span>
          <kbd className="shrink-0 rounded border border-border px-1 text-[10px] text-muted-foreground">
            Enter
          </kbd>
        </button>
      )}

      {/* Lista */}
      <div className="scroll-thin max-h-60 overflow-y-auto p-1.5">
        {ordered.length === 0 && !canCreate && (
          <div className="flex flex-col items-center gap-1 px-2 py-6 text-center">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              {term ? "Nenhuma tag encontrada." : "Nenhuma tag ainda. Digite para criar."}
            </p>
          </div>
        )}

        {ordered.map((name) => {
          const tagColor = defs.find((d) => d.name === name)?.color ?? "slate";
          const isEditing = editing === name;
          const isSelected = selected.includes(name);

          if (isEditing) {
            return (
              <div key={name} className="flex items-center gap-1.5 rounded-md px-2 py-1.5">
                <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
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
                  className="min-w-0 flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] outline-none focus:border-primary"
                />
              </div>
            );
          }

          return (
            <div
              key={name}
              className={cn(
                "group/row flex items-center gap-1.5 rounded-md px-2 py-1.5 transition hover:bg-accent",
                isSelected && "bg-accent/60",
              )}
            >
              <button
                onClick={() => onToggle(name)}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? "Remover" : "Adicionar"} tag ${name}`}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border group-hover/row:border-foreground/40",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate rounded-full border border-foreground/10 px-2 py-0.5 text-[11px]",
                    noteBg[tagColor],
                  )}
                >
                  #{name}
                </span>
              </button>

              <div className="flex shrink-0 items-center opacity-0 transition group-hover/row:opacity-100 focus-within:opacity-100">
                <ColorPicker
                  value={tagColor}
                  label={`Cor da tag ${name}`}
                  onPick={(c) => store.setTagColor(name, c)}
                />
                <button
                  aria-label={`Renomear tag ${name}`}
                  title="Renomear"
                  onClick={() => {
                    setEditing(name);
                    setDraft(name);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {confirmDelete === name ? (
                  <button
                    aria-label={`Confirmar exclusão da tag ${name}`}
                    onClick={() => {
                      store.removeTag(name);
                      setConfirmDelete(null);
                    }}
                    onBlur={() => setConfirmDelete(null)}
                    autoFocus
                    className="rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground"
                  >
                    Excluir?
                  </button>
                ) : (
                  <button
                    aria-label={`Excluir tag ${name}`}
                    title="Excluir"
                    onClick={() => setConfirmDelete(name)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
