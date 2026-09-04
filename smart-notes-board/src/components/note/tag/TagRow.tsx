import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { boardActions } from "@/stores/board";
import { noteBg } from "@/components/note/note-style";
import { cn } from "@/lib/utils";
import { TagColorPicker } from "./TagColorPicker";
import type { NoteColor } from "@/lib/board/model";

/**
 * Uma tag na lista: marcar, renomear, pintar e excluir.
 *
 * Renomear e confirmar exclusão são estados da própria linha — mantê-los aqui
 * evita que o painel precise guardar "qual linha está em qual modo".
 */
export function TagRow({
  name,
  color,
  selected,
  onToggle,
}: {
  name: string;
  color: NoteColor;
  selected: boolean;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (draft !== null) {
    const commit = () => {
      boardActions.renameTag(name, draft);
      setDraft(null);
    };
    return (
      <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5">
        <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") setDraft(null);
          }}
          aria-label={`Renomear tag ${name}`}
          className="min-w-0 flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] outline-none focus:border-primary"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/row flex items-center gap-1.5 rounded-md px-2 py-1.5 transition hover:bg-accent",
        selected && "bg-accent/60",
      )}
    >
      <button
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={`${selected ? "Remover" : "Adicionar"} tag ${name}`}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border group-hover/row:border-foreground/40",
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
        <span
          className={cn(
            "min-w-0 truncate rounded-full border border-foreground/10 px-2 py-0.5 text-[11px]",
            noteBg[color],
          )}
        >
          #{name}
        </span>
      </button>

      {/* Ações só aparecem no hover ou no foco: a lista é para escolher, não para administrar. */}
      <div className="flex shrink-0 items-center opacity-0 transition focus-within:opacity-100 group-hover/row:opacity-100">
        <TagColorPicker
          value={color}
          label={`Cor da tag ${name}`}
          onPick={(picked) => boardActions.setTagColor(name, picked)}
        />
        <button
          aria-label={`Renomear tag ${name}`}
          title="Renomear"
          onClick={() => setDraft(name)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {confirmingDelete ? (
          <button
            autoFocus
            aria-label={`Confirmar exclusão da tag ${name}`}
            onClick={() => {
              boardActions.removeTag(name);
              setConfirmingDelete(false);
            }}
            onBlur={() => setConfirmingDelete(false)}
            className="rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground"
          >
            Excluir?
          </button>
        ) : (
          <button
            aria-label={`Excluir tag ${name}`}
            title="Excluir"
            onClick={() => setConfirmingDelete(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
