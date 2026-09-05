import Anthropic from "@anthropic-ai/sdk";
import type { AiModel } from "@/lib/ai/settings";

/**
 * A conversa com o Claude.
 *
 * Roda direto do navegador porque o app não tem servidor — daí o
 * `dangerouslyAllowBrowser`. O nome da flag não é exagero: a chave fica na
 * máquina de quem usa e é legível por qualquer script desta página. É o preço
 * de um app sem backend, e a tela de configuração diz isso claramente.
 */

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  /** Notas que a resposta criou, para a interface poder abri-las. */
  createdNotes?: Array<{ id: string; title: string }>;
};

/** Ferramenta que deixa o modelo criar notas em vez de pedir que copiem o texto. */
export const CREATE_NOTE_TOOL: Anthropic.Tool = {
  name: "criar_nota",
  description:
    "Cria uma nota autoadesiva no arquivo aberto. Use sempre que a pessoa pedir para criar, anotar ou registrar algo — nunca escreva a nota na resposta pedindo que copiem.",
  input_schema: {
    type: "object",
    properties: {
      titulo: { type: "string", description: "Título curto e específico." },
      conteudo: {
        type: "string",
        description: "Corpo da nota. Aceita markdown simples.",
      },
      etiquetas: {
        type: "array",
        items: { type: "string" },
        description: "Etiquetas em minúsculas, opcional.",
      },
    },
    required: ["titulo", "conteudo"],
    additionalProperties: false,
  },
  strict: true,
};

export type CreateNoteInput = {
  titulo: string;
  conteudo: string;
  etiquetas?: string[];
};

export function createClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/** Traduz os erros da API para algo acionável em português. */
export function describeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "Chave de API recusada. Confira se ela está correta e ativa.";
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return "Essa chave não tem permissão para este modelo.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "Limite de uso atingido. Tente de novo em instantes.";
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Não foi possível falar com a API. Verifique sua conexão.";
  }
  if (error instanceof Anthropic.APIError) {
    return error.message || "A API devolveu um erro.";
  }
  return error instanceof Error ? error.message : "Algo deu errado.";
}

export type StreamHandlers = {
  onText: (chunk: string) => void;
  onCreateNote: (input: CreateNoteInput) => { id: string; title: string };
};

/**
 * Envia a conversa e transmite a resposta.
 *
 * Streaming não é enfeite: sem ele, uma resposta longa fica parada até o fim e
 * pode estourar o tempo da requisição.
 */
export async function askAssistant({
  client,
  model,
  system,
  history,
  signal,
  handlers,
}: {
  client: Anthropic;
  model: AiModel;
  system: string;
  history: Anthropic.MessageParam[];
  signal?: AbortSignal;
  handlers: StreamHandlers;
}): Promise<void> {
  const messages = [...history];

  // O modelo pode criar várias notas antes de concluir a resposta, então o
  // laço só termina quando ele para de pedir ferramentas.
  for (let volta = 0; volta < 6; volta++) {
    const stream = client.messages.stream(
      {
        model,
        max_tokens: 8000,
        system,
        tools: [CREATE_NOTE_TOOL],
        messages,
      },
      signal ? { signal } : {},
    );

    stream.on("text", handlers.onText);
    const resposta = await stream.finalMessage();

    const chamadas = resposta.content.filter(
      (bloco): bloco is Anthropic.ToolUseBlock => bloco.type === "tool_use",
    );
    if (chamadas.length === 0) return;

    messages.push({ role: "assistant", content: resposta.content });
    messages.push({
      role: "user",
      content: chamadas.map((chamada) => {
        const criada = handlers.onCreateNote(chamada.input as CreateNoteInput);
        return {
          type: "tool_result" as const,
          tool_use_id: chamada.id,
          content: `Nota criada: "${criada.title}" (id ${criada.id})`,
        };
      }),
    });
  }
}
