import Anthropic from "@anthropic-ai/sdk";
import {
  CREATE_NOTE_TOOL,
  MAX_TOOL_ROUNDS,
  type AiClient,
  type AskParams,
  type CreateNoteInput,
} from "@/lib/ai/types";

/**
 * O Claude.
 *
 * Só este arquivo conhece o SDK da Anthropic. Quem usa o assistente fala com
 * `AiClient`, e o carregamento é sob demanda — abrir o chat com a OpenAI
 * escolhida não baixa este código.
 */

const tool: Anthropic.Tool = {
  name: CREATE_NOTE_TOOL.name,
  description: CREATE_NOTE_TOOL.description,
  input_schema: {
    type: "object",
    properties: {
      titulo: { type: "string", description: CREATE_NOTE_TOOL.fields.titulo },
      conteudo: { type: "string", description: CREATE_NOTE_TOOL.fields.conteudo },
      etiquetas: {
        type: "array",
        items: { type: "string" },
        description: CREATE_NOTE_TOOL.fields.etiquetas,
      },
    },
    required: ["titulo", "conteudo"],
    additionalProperties: false,
  },
  strict: true,
};

// O app não tem servidor: a chave fica na máquina de quem usa, e a flag diz
// exatamente isso. Ver o aviso na tela de configuração.
const criarCliente = (apiKey: string) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

async function ask({
  apiKey,
  model,
  system,
  history,
  blocks,
  signal,
  handlers,
}: AskParams): Promise<void> {
  const client = criarCliente(apiKey);

  const conteudo: Anthropic.ContentBlockParam[] = blocks.map((bloco) =>
    bloco.kind === "text"
      ? { type: "text", text: bloco.text }
      : {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: bloco.base64 },
          title: bloco.name,
        },
  );

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.text })),
    { role: "user", content: conteudo },
  ];

  for (let volta = 0; volta < MAX_TOOL_ROUNDS; volta++) {
    const stream = client.messages.stream(
      { model, max_tokens: 8000, system, tools: [tool], messages },
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

async function listModels(apiKey: string): Promise<string[]> {
  const pagina = await criarCliente(apiKey).models.list();
  return pagina.data.map((m) => m.id);
}

function describeError(error: unknown): string | null {
  if (error instanceof Anthropic.AuthenticationError) {
    return "Chave de API recusada. Confira se ela está correta e ativa.";
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return "Essa chave não tem permissão para este modelo.";
  }
  if (error instanceof Anthropic.NotFoundError) {
    return "Modelo não encontrado. Escolha outro na lista de modelos.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "Limite de uso atingido. Tente de novo em instantes.";
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Não foi possível falar com a API. Verifique sua conexão.";
  }
  if (error instanceof Anthropic.APIError) return error.message || "A API devolveu um erro.";
  return null;
}

export const anthropicClient: AiClient = { ask, listModels, describeError };
