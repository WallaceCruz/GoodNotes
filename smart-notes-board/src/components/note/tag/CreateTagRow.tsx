import { Plus } from "lucide-react";
import { noteBg } from "@/components/note/note-style";
import { cn } from "@/lib/utils";
import type { NoteColor } from "@/lib/board/model";

/** Atalho para criar a tag que a busca não encontrou, já na cor sugerida. */
export function CreateTagRow({
  name,
  color,
  onCreate,
}: {
  name: string;
  color: NoteColor;
  onCreate: () => void;
}) {
  return (
    <button
      onClick={onCreate}
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
            noteBg[color],
          )}
        >
          #{name}
        </span>
      </span>
      <kbd className="shrink-0 rounded border border-border px-1 text-[10px] text-muted-foreground">
        Enter
      </kbd>
    </button>
  );
}
