import OpenAI from "openai";
import { isChatModel } from "@/lib/ai/providers";
import {
  CREATE_NOTE_TOOL,
  MAX_TOOL_ROUNDS,
  type AiClient,
  type AskParams,
  type CreateNoteInput,
} from "@/lib/ai/types";

/**
 * O GPT.
 *
 * Só este arquivo conhece o SDK da OpenAI. O resto do app fala com `AiClient`.
 */

const tool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: CREATE_NOTE_TOOL.name,
    description: CREATE_NOTE_TOOL.description,
    parameters: {
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
  },
};

const criarCliente = (apiKey: string) => new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

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

  // A API de chat não recebe PDF como bloco: o nome do arquivo entra no texto
  // para o modelo saber que existe, e o conteúdo textual já vem em `text`.
  const pergunta = blocks
    .map((bloco) =>
      bloco.kind === "text" ? bloco.text : `[anexo não enviado: ${bloco.name} (PDF)]`,
    )
    .join("\n\n");

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...history.map((m) => ({ role: m.role, content: m.text }) as const),
    { role: "user", content: pergunta },
  ];

  for (let volta = 0; volta < MAX_TOOL_ROUNDS; volta++) {
    const stream = await client.chat.completions.create(
      { model, messages, tools: [tool], stream: true },
      signal ? { signal } : {},
    );

    let texto = "";
    // As chamadas de ferramenta chegam em pedaços e precisam ser remontadas.
    const chamadas = new Map<number, { id: string; name: string; args: string }>();

    for await (const parte of stream) {
      const delta = parte.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        texto += delta.content;
        handlers.onText(delta.content);
      }
      for (const chamada of delta.tool_calls ?? []) {
        const atual = chamadas.get(chamada.index) ?? { id: "", name: "", args: "" };
        chamadas.set(chamada.index, {
          id: chamada.id ?? atual.id,
          name: chamada.function?.name ?? atual.name,
          args: atual.args + (chamada.function?.arguments ?? ""),
        });
      }
    }

    if (chamadas.size === 0) return;

    const lista = [...chamadas.values()];
    messages.push({
      role: "assistant",
      content: texto || null,
      tool_calls: lista.map((c) => ({
        id: c.id,
        type: "function" as const,
        function: { name: c.name, arguments: c.args },
      })),
    });

    for (const chamada of lista) {
      const criada = handlers.onCreateNote(JSON.parse(chamada.args) as CreateNoteInput);
      messages.push({
        role: "tool",
        tool_call_id: chamada.id,
        content: `Nota criada: "${criada.title}" (id ${criada.id})`,
      });
    }
  }
}

async function listModels(apiKey: string): Promise<string[]> {
  const pagina = await criarCliente(apiKey).models.list();
  return pagina.data
    .map((m) => m.id)
    .filter(isChatModel)
    .sort();
}

function describeError(error: unknown): string | null {
  if (error instanceof OpenAI.AuthenticationError) {
    return "Chave de API recusada. Confira se ela está correta e ativa.";
  }
  if (error instanceof OpenAI.PermissionDeniedError) {
    return "Essa chave não tem permissão para este modelo.";
  }
  if (error instanceof OpenAI.NotFoundError) {
    return "Modelo não encontrado. Escolha outro na lista de modelos.";
  }
  if (error instanceof OpenAI.RateLimitError) {
    return "Limite de uso atingido. Tente de novo em instantes.";
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return "Não foi possível falar com a API. Verifique sua conexão.";
  }
  if (error instanceof OpenAI.APIError) return error.message || "A API devolveu um erro.";
  return null;
}

export const openaiClient: AiClient = { ask, listModels, describeError };
