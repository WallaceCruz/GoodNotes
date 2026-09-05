import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { emptyFilters, matchesFilters } from "@/lib/board/filters";
import { noteBg } from "@/components/note/note-style";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/board/model";

/**
 * Escolher notas do quadro para a conversa.
 *
 * O escopo automático cobre a nota aberta; isto é para quando a pergunta cruza
 * várias — "compare estas três", "o que falta entre elas". Sem a busca a lista
 * seria inútil em quadros grandes.
 */
export function NotePicker({
  notes,
  selectedIds,
  onToggle,
  onClose,
}: {
  notes: Note[];
  selectedIds: string[];
  onToggle: (note: Note) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const visiveis = useMemo(
    () =>
      notes.filter((note) => !note.archived && matchesFilters(note, { ...emptyFilters, query })),
    [notes, query],
  );

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-popover">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <h3 className="flex-1 text-[13px] font-semibold">
          Escolher notas
          {selectedIds.length > 0 && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              {selectedIds.length} selecionada(s)
            </span>
          )}
        </h3>
        <button
          onClick={onClose}
          aria-label="Fechar seleção de notas"
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nota"
            aria-label="Buscar nota"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          />
        </div>
      </div>

      <ul className="scroll-thin flex-1 overflow-y-auto px-2 pb-3">
        {visiveis.length === 0 && (
          <li className="px-3 py-8 text-center text-[12px] text-muted-foreground">
            Nenhuma nota encontrada.
          </li>
        )}
        {visiveis.map((note) => {
          const marcada = selectedIds.includes(note.id);
          return (
            <li key={note.id}>
              <button
                onClick={() => onToggle(note)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                    marcada ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {marcada && <Check className="h-3 w-3" />}
                </span>
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", noteBg[note.color])} />
                <span className="min-w-0 flex-1 truncate text-[13px]">
                  {note.title || "Sem título"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
