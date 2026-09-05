import { ChevronRight, MessageSquare } from "lucide-react";
import { initials } from "@/hooks/useUserProfile";
import { timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { CommentEntry } from "@/lib/board/comments";

/**
 * A conversa do arquivo, em lista.
 *
 * O mesmo desenho serve ao painel lateral do desktop e à aba de Inbox dentro
 * das notificações — o que muda entre eles é só a moldura, então a lista em si
 * não conhece nenhuma das duas.
 */
export function CommentFeed({
  entries,
  activeNoteId,
  emptyTitle,
  emptyHint,
  compact = false,
  onSelect,
}: {
  entries: CommentEntry[];
  activeNoteId?: string | null;
  emptyTitle: string;
  emptyHint?: string;
  /** Versão apertada, para caber dentro de um painel suspenso. */
  compact?: boolean;
  onSelect: (noteId: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-1.5 text-center",
          compact ? "px-4 py-8" : "px-6 py-12",
        )}
      >
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>{emptyTitle}</p>
        {emptyHint && <p className="text-[11px] text-muted-foreground">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <ul>
      {entries.map(({ comment, note }) => (
        <li key={comment.id}>
          <button
            onClick={() => onSelect(note.id)}
            className={cn(
              "flex w-full items-start gap-2.5 border-b border-border/70 text-left transition-colors hover:bg-accent",
              compact ? "px-3 py-2.5" : "px-4 py-3",
              activeNoteId === note.id && "bg-accent",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground",
                compact ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]",
              )}
            >
              {initials(comment.author)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span
                  className={cn("truncate font-semibold", compact ? "text-[12px]" : "text-[14px]")}
                >
                  {comment.author}
                </span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                  {timeAgo(comment.createdAt)}
                </span>
              </span>

              <span
                className={cn(
                  "mt-0.5 block whitespace-pre-wrap leading-relaxed",
                  compact ? "line-clamp-2 text-[12px]" : "line-clamp-3 text-[14px]",
                )}
              >
                {comment.text}
              </span>

              {/* Em qual nota, para o comentário não ficar sem contexto. */}
              <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <MessageSquare className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{note.title || "Sem título"}</span>
              </span>
            </span>

            {!compact && (
              <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/60" />
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
