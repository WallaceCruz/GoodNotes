import { useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { boardActions } from "@/stores/board";
import { initials, useUserProfile } from "@/hooks/useUserProfile";
import { timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Comment } from "@/lib/board/model";

function CommentRow({ comment, onRemove }: { comment: Comment; onRemove: () => void }) {
  return (
    <li className="group/comment flex gap-2 px-3 py-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
        {initials(comment.author)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[12px] font-semibold">{comment.author}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
          <button
            onClick={onRemove}
            aria-label={`Excluir comentário de ${comment.author}`}
            className="ml-auto shrink-0 text-muted-foreground opacity-0 transition hover:text-destructive focus-visible:opacity-100 group-hover/comment:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-foreground/90">
          {comment.text}
        </p>
      </div>
    </li>
  );
}

/**
 * Conversa do time numa nota. O gatilho mostra a contagem, então dá para ver
 * que há discussão sem abrir o painel.
 */
export function NoteComments({
  noteId,
  comments,
  compact = false,
}: {
  noteId: string;
  comments: Comment[];
  /** Versão reduzida, para o rodapé do card. */
  compact?: boolean;
}) {
  const { profile } = useUserProfile();
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    boardActions.addComment(noteId, profile.name, draft);
    setDraft("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={comments.length ? `Comentários (${comments.length})` : "Comentar nesta nota"}
          title={comments.length ? `${comments.length} comentário(s)` : "Comentar"}
          // O card é arrastável: sem barrar o pointerdown, o dnd-kit inicia um
          // arraste e o clique nunca chega a abrir o painel.
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full border border-dashed border-foreground/25 px-1.5 py-0.5 text-foreground/50 transition hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground/80",
            compact ? "text-[10px]" : "text-[11px]",
            comments.length > 0 && "border-solid border-foreground/20 text-foreground/70",
          )}
        >
          <MessageSquare className="h-2.5 w-2.5" />
          {comments.length > 0 ? comments.length : "comentar"}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[20rem] p-0"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-3 py-2">
          <span className="text-[13px] font-semibold">Comentários</span>
          {comments.length > 0 && (
            <span className="ml-1.5 text-[11px] text-muted-foreground">{comments.length}</span>
          )}
        </div>

        {comments.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
            Ainda sem comentários. Escreva o primeiro abaixo.
          </p>
        ) : (
          <ul className="scroll-thin max-h-64 divide-y divide-border overflow-y-auto">
            {comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                onRemove={() => boardActions.removeComment(noteId, comment.id)}
              />
            ))}
          </ul>
        )}

        <div className="flex items-end gap-1.5 border-t border-border p-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter envia; Shift+Enter quebra linha.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Escreva um comentário…"
            aria-label="Novo comentário"
            className="scroll-thin min-h-[2.25rem] w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-[12px] outline-none focus:border-primary"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            aria-label="Enviar comentário"
            className="mb-0.5 shrink-0 rounded-md bg-primary p-1.5 text-primary-foreground transition disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
