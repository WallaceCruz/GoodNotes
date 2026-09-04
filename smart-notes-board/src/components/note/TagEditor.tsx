import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagManager } from "@/components/note/tag/TagManager";
import { noteBg } from "@/components/note/note-style";
import { tagColorOf } from "@/lib/board/tags";
import { boardActions, useFileTags } from "@/stores/board";
import { cn } from "@/lib/utils";
import type { NoteColor } from "@/lib/board/model";

/** Tags de uma nota: as atuais em linha, e um painel para escolher ou criar. */
export function TagEditor({
  tags,
  onChange,
  size = "sm",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  size?: "sm" | "md";
}) {
  const [query, setQuery] = useState("");
  const definitions = useFileTags();
  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  const toggle = (name: string) =>
    onChange(tags.includes(name) ? tags.filter((tag) => tag !== name) : [...tags, name]);

  // Criar registra a tag no arquivo e já a aplica à nota — dois passos viram um.
  const create = (color: NoteColor) => {
    const name = query.trim().toLowerCase();
    if (!name) return;
    boardActions.addTag(name, color);
    if (!tags.includes(name)) onChange([...tags, name]);
    setQuery("");
  };

  const term = query.trim().toLowerCase();
  const matching = definitions.filter((tag) => tag.name.includes(term));
  const alreadyExists = definitions.some((tag) => tag.name === term);

  return (
    <div className="flex flex-wrap items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "group/tag flex items-center gap-1 rounded-full border border-foreground/10 px-2 py-0.5 text-foreground/80",
            noteBg[tagColorOf(definitions, tag)],
            textSize,
          )}
        >
          #{tag}
          <button
            aria-label={`Remover tag ${tag}`}
            onClick={(event) => {
              event.stopPropagation();
              onChange(tags.filter((current) => current !== tag));
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
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "flex items-center gap-0.5 rounded-full border border-dashed border-foreground/25 px-1.5 py-0.5 text-foreground/50 transition hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground/80",
              textSize,
            )}
          >
            <Plus className="h-2.5 w-2.5" />
            tag
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[19rem] p-0"
          onClick={(event) => event.stopPropagation()}
        >
          <TagManager
            selected={tags}
            onToggle={toggle}
            query={query}
            setQuery={setQuery}
            onCreate={create}
            filtered={matching.map((tag) => tag.name)}
            canCreate={!!term && !alreadyExists}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
