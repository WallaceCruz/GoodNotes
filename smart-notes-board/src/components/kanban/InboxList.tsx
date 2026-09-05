import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { allComments, matchesQuery } from "@/lib/board/comments";
import { CommentFeed } from "@/components/note/CommentFeed";
import type { Note } from "@/lib/board/model";

/**
 * A conversa do arquivo: quem comentou, o que disse e em qual nota.
 *
 * Antes esta lista repetia as notas do quadro, mostrando o texto que já estava
 * visível ao lado. Agora ela mostra o que só existe aqui — os comentários do
 * time — e clicar num deles abre a nota comentada.
 */
export function InboxList({
  notes,
  activeId,
  onSelect,
}: {
  notes: Note[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const entries = useMemo(
    () => allComments(notes).filter((entry) => matchesQuery(entry, query)),
    [notes, query],
  );

  return (
    <section className="flex w-80 shrink-0 flex-col border-r border-border bg-background">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Inbox</h2>
        <span className="text-xs text-muted-foreground">{entries.length}</span>
      </header>

      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por autor, texto ou nota"
            aria-label="Buscar comentários"
            className="w-full bg-transparent text-xs outline-none"
          />
          {query && (
            <button
              aria-label="Limpar busca"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto">
        <CommentFeed
          entries={entries}
          activeNoteId={activeId}
          emptyTitle={query ? "Nenhum comentário encontrado" : "Nenhum comentário ainda"}
          {...(query
            ? {}
            : {
                emptyHint: "Use o ícone de mensagem no rodapé de uma nota para começar a conversa.",
              })}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}
