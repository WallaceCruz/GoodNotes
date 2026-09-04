import { X } from "lucide-react";
import { tagColorOf } from "@/lib/board/tags";
import { noteBg } from "@/components/note/note-style";
import { cn } from "@/lib/utils";
import type { TagDef } from "@/lib/board/model";

/** As tags já marcadas, sempre visíveis mesmo quando a busca as esconderia. */
export function SelectedTagChips({
  selected,
  definitions,
  onRemove,
}: {
  selected: string[];
  definitions: TagDef[];
  onRemove: (name: string) => void;
}) {
  if (selected.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
      {selected.map((name) => (
        <button
          key={name}
          onClick={() => onRemove(name)}
          aria-label={`Remover ${name}`}
          className={cn(
            "flex items-center gap-1 rounded-full border border-foreground/10 px-2 py-0.5 text-[11px] text-foreground/80 transition hover:opacity-80",
            noteBg[tagColorOf(definitions, name)],
          )}
        >
          #{name}
          <X className="h-2.5 w-2.5" />
        </button>
      ))}
    </div>
  );
}
