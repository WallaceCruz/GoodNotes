import { useCallback } from "react";
import { useLocalStore } from "@/hooks/useLocalStore";
import { uid } from "@/lib/id";
import type { ChatMessage } from "@/lib/ai/assistant";

/**
 * As conversas anteriores.
 *
 * Ficam no armazenamento local junto do resto das preferências. Guardar tudo
 * para sempre encheria a cota — e a cota cheia derruba a gravação do quadro
 * inteiro, não só a do assistente — então o histórico tem teto: as mais
 * recentes ficam, as antigas caem.
 */

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

/** Teto do histórico. Acima disto, a conversa mais antiga sai. */
const MAX_CONVERSAS = 30;

const KEY = "sticky-flow:assistant-history";

const EMPTY: Conversation[] = [];

function parseHistory(raw: unknown): Conversation[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(
    (c): c is Conversation =>
      !!c && typeof c.id === "string" && Array.isArray(c.messages) && typeof c.title === "string",
  );
}

/** O título vem da primeira pergunta — é como a pessoa vai reconhecer a conversa. */
export function titleFrom(messages: ChatMessage[]): string {
  const primeira = messages.find((m) => m.role === "user")?.text.trim() ?? "";
  if (!primeira) return "Nova conversa";
  return primeira.length > 48 ? `${primeira.slice(0, 48)}…` : primeira;
}

export function useConversations() {
  const { value: conversations, setValue } = useLocalStore({
    key: KEY,
    fallback: EMPTY,
    parse: parseHistory,
    label: "conversas do assistente",
  });

  /** Grava a conversa: cria se for nova, atualiza e traz para o topo se já existe. */
  const save = useCallback(
    (id: string, messages: ChatMessage[]) => {
      if (messages.length === 0) return;
      setValue((atuais) => {
        const conversa: Conversation = {
          id,
          title: titleFrom(messages),
          messages,
          updatedAt: Date.now(),
        };
        const resto = atuais.filter((c) => c.id !== id);
        return [conversa, ...resto].slice(0, MAX_CONVERSAS);
      });
    },
    [setValue],
  );

  const remove = useCallback(
    (id: string) => setValue((atuais) => atuais.filter((c) => c.id !== id)),
    [setValue],
  );

  const clear = useCallback(() => setValue(EMPTY), [setValue]);

  return { conversations, save, remove, clear, newId: uid };
}
