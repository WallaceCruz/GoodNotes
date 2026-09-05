import { MessageSquare, Trash2, X } from "lucide-react";
import { timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/ai/history";

/** As conversas anteriores, da mais recente para a mais antiga. */
export function ConversationList({
  conversations,
  activeId,
  onOpen,
  onRemove,
  onClose,
}: {
  conversations: Conversation[];
  activeId: string;
  onOpen: (conversation: Conversation) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-popover">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <h3 className="flex-1 text-[13px] font-semibold">Conversas</h3>
        <button
          onClick={onClose}
          aria-label="Fechar histórico"
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 text-center">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <p className="text-[13px] font-medium">Nenhuma conversa ainda</p>
          <p className="text-[11px] text-muted-foreground">
            As conversas ficam guardadas neste navegador.
          </p>
        </div>
      ) : (
        <ul className="scroll-thin flex-1 overflow-y-auto p-2">
          {conversations.map((conversa) => (
            <li key={conversa.id} className="group/conversa flex items-center gap-1">
              <button
                onClick={() => onOpen(conversa)}
                className={cn(
                  "min-w-0 flex-1 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent",
                  activeId === conversa.id && "bg-accent",
                )}
              >
                <span className="block truncate text-[13px]">{conversa.title}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {timeAgo(conversa.updatedAt)} · {conversa.messages.length} mensagens
                </span>
              </button>
              <button
                onClick={() => onRemove(conversa.id)}
                aria-label={`Excluir conversa ${conversa.title}`}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover/conversa:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
