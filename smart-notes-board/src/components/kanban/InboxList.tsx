import { useMemo, useState } from "react";
import { MessageSquare, Search, X } from "lucide-react";
import { allComments, matchesQuery } from "@/lib/board/comments";
import { initials } from "@/hooks/useUserProfile";
import { timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";
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
        <span className="ml-auto text-[11px] text-muted-foreground">Comentários do time</span>
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
        {entries.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">
              {query ? "Nenhum comentário encontrado" : "Nenhum comentário ainda"}
            </p>
            {!query && (
              <p className="text-xs text-muted-foreground">
                Use o ícone de mensagem no rodapé de uma nota para começar a conversa.
              </p>
            )}
          </div>
        )}

        {entries.map(({ comment, note }) => (
          <button
            key={comment.id}
            onClick={() => onSelect(note.id)}
            className={cn(
              "block w-full border-b border-border px-4 py-3 text-left hover:bg-accent",
              activeId === note.id && "bg-accent",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
                {initials(comment.author)}
              </span>
              <span className="truncate text-xs font-medium text-foreground">{comment.author}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {timeAgo(comment.createdAt)}
              </span>
            </div>

            <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed">
              {comment.text}
            </p>

            {/* Em qual nota, para o comentário não ficar sem contexto. */}
            <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <MessageSquare className="h-3 w-3 shrink-0" />
              <span className="truncate">{note.title || "Sem título"}</span>
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
