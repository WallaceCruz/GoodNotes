import { useMemo } from "react";
import { Tag as TagIcon } from "lucide-react";
import { useFileTags } from "@/stores/board";
import { tagColorOf } from "@/lib/board/tags";
import { autoColor } from "./auto-color";
import { CreateTagRow } from "./CreateTagRow";
import { SelectedTagChips } from "./SelectedTagChips";
import { TagRow } from "./TagRow";
import { TagSearchField } from "./TagSearchField";
import type { NoteColor } from "@/lib/board/model";

/** Painel de tags: buscar, criar, marcar, e administrar cada uma na própria linha. */
export function TagManager({
  selected,
  onToggle,
  query,
  setQuery,
  onCreate,
  filtered,
  canCreate,
}: {
  selected: string[];
  onToggle: (name: string) => void;
  query: string;
  setQuery: (query: string) => void;
  /** Recebe a cor sugerida: quem cria não precisa decidi-la antes. */
  onCreate: (color: NoteColor) => void;
  filtered: string[];
  canCreate: boolean;
}) {
  const definitions = useFileTags();
  const term = query.trim().toLowerCase();
  const suggestedColor = useMemo(() => autoColor(term), [term]);

  // Criar já usando a cor sugerida: escolher cor antes de existir a tag é atrito.
  const create = () => {
    if (canCreate) onCreate(suggestedColor);
  };

  // As marcadas sobem, para não sumirem no meio de uma lista longa.
  const ordered = useMemo(
    () => [...filtered].sort((a, b) => Number(selected.includes(b)) - Number(selected.includes(a))),
    [filtered, selected],
  );

  return (
    <div className="flex flex-col">
      <TagSearchField
        query={query}
        onChangeQuery={setQuery}
        onSubmit={() => {
          if (canCreate) create();
          else if (ordered[0]) onToggle(ordered[0]);
        }}
      />

      <SelectedTagChips selected={selected} definitions={definitions} onRemove={onToggle} />

      {canCreate && <CreateTagRow name={term} color={suggestedColor} onCreate={create} />}

      <div className="scroll-thin max-h-60 overflow-y-auto p-1.5">
        {ordered.length === 0 && !canCreate && (
          <div className="flex flex-col items-center gap-1 px-2 py-6 text-center">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              {term ? "Nenhuma tag encontrada." : "Nenhuma tag ainda. Digite para criar."}
            </p>
          </div>
        )}

        {ordered.map((name) => (
          <TagRow
            key={name}
            name={name}
            color={tagColorOf(definitions, name)}
            selected={selected.includes(name)}
            onToggle={() => onToggle(name)}
          />
        ))}
      </div>
    </div>
  );
}
