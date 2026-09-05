import { useMemo } from "react";
import { ChevronRight, MessageSquare } from "lucide-react";
import { allComments, matchesQuery } from "@/lib/board/comments";
import { initials } from "@/hooks/useUserProfile";
import { timeAgo } from "@/lib/date";
import type { Note } from "@/lib/board/model";

/**
 * A conversa do arquivo no celular.
 *
 * Mostra o que só existe aqui — os comentários do time — e não o texto das
 * notas, que a aba de tarefas já lista. Tocar num comentário abre a nota
 * comentada.
 */
export function MobileInbox({
  notes,
  query,
  onOpenNote,
}: {
  notes: Note[];
  query: string;
  onOpenNote: (id: string) => void;
}) {
  const entries = useMemo(
    () => allComments(notes).filter((entry) => matchesQuery(entry, query)),
    [notes, query],
  );

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 pb-28 text-center">
        <MessageSquare className="h-7 w-7 text-muted-foreground" />
        <p className="text-base font-semibold">
          {query ? "Nenhum comentário encontrado" : "Nenhum comentário ainda"}
        </p>
        {!query && (
          <p className="text-sm text-muted-foreground">
            Abra uma nota e use o campo Comentários para começar a conversa.
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-28">
      {entries.map(({ comment, note }) => (
        <li key={comment.id}>
          <button
            onClick={() => onOpenNote(note.id)}
            className="flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
              {initials(comment.author)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="truncate text-[14px] font-semibold">{comment.author}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {timeAgo(comment.createdAt)}
                </span>
              </span>
              <span className="mt-0.5 line-clamp-3 block whitespace-pre-wrap text-[14px] leading-relaxed">
                {comment.text}
              </span>
              {/* Em qual nota, para o comentário não ficar sem contexto. */}
              <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MessageSquare className="h-3 w-3 shrink-0" />
                <span className="truncate">{note.title || "Sem título"}</span>
              </span>
            </span>

            <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/60" />
          </button>
        </li>
      ))}
    </ul>
  );
}
