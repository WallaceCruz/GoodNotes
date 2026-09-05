import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI, Type } from "@google/genai";
import { isChatModel, type ProviderId } from "@/lib/ai/providers";

/**
 * A conversa, seja com qual provedor for.
 *
 * Os três SDKs têm formatos próprios de mensagem, streaming e ferramenta.
 * Em vez de espalhar `if (provedor === ...)` pela tela, cada um implementa a
 * mesma função `ask` e o painel não sabe qual está falando.
 *
 * Todos rodam direto do navegador, porque o app não tem servidor — daí os
 * sinalizadores de "browser" que cada SDK exige. Não é exagero deles: a chave
 * fica na máquina de quem usa e é legível por qualquer script desta página.
 */

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  /** Notas que a resposta criou, para a interface poder abri-las. */
  createdNotes?: Array<{ id: string; title: string }>;
};

export type CreateNoteInput = {
  titulo: string;
  conteudo: string;
  etiquetas?: string[];
};

export type StreamHandlers = {
  onText: (chunk: string) => void;
  onCreateNote: (input: CreateNoteInput) => { id: string; title: string };
};

/** Um bloco de conteúdo já pronto: texto puro ou um documento anexado. */
export type ContextBlock =
  | { kind: "text"; text: string }
  | { kind: "document"; name: string; mediaType: string; base64: string };

export type AskParams = {
  apiKey: string;
  model: string;
  system: string;
  /** Turnos anteriores, só texto. */
  history: Array<{ role: ChatRole; text: string }>;
  /** A pergunta desta vez, com os anexos que a acompanham. */
  blocks: ContextBlock[];
  signal?: AbortSignal;
  handlers: StreamHandlers;
};

const FERRAMENTA = {
  nome: "criar_nota",
  descricao:
    "Cria uma nota autoadesiva no arquivo aberto. Use sempre que a pessoa pedir para criar, anotar ou registrar algo — nunca escreva a nota na resposta pedindo que copiem.",
  campos: {
    titulo: "Título curto e específico.",
    conteudo: "Corpo da nota. Aceita markdown simples.",
    etiquetas: "Etiquetas em minúsculas, opcional.",
  },
} as const;

/** Quantas voltas de ferramenta antes de desistir — evita laço infinito. */
const MAX_VOLTAS = 6;

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

const anthropicTool: Anthropic.Tool = {
  name: FERRAMENTA.nome,
  description: FERRAMENTA.descricao,
  input_schema: {
    type: "object",
    properties: {
      titulo: { type: "string", description: FERRAMENTA.campos.titulo },
      conteudo: { type: "string", description: FERRAMENTA.campos.conteudo },
      etiquetas: {
        type: "array",
        items: { type: "string" },
        description: FERRAMENTA.campos.etiquetas,
      },
    },
    required: ["titulo", "conteudo"],
    additionalProperties: false,
  },
  strict: true,
};

async function askAnthropic({
  apiKey,
  model,
  system,
  history,
  blocks,
  signal,
  handlers,
}: AskParams): Promise<void> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

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

  for (let volta = 0; volta < MAX_VOLTAS; volta++) {
    const stream = client.messages.stream(
      { model, max_tokens: 8000, system, tools: [anthropicTool], messages },
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

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

const openaiTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: FERRAMENTA.nome,
    description: FERRAMENTA.descricao,
    parameters: {
      type: "object",
      properties: {
        titulo: { type: "string", description: FERRAMENTA.campos.titulo },
        conteudo: { type: "string", description: FERRAMENTA.campos.conteudo },
        etiquetas: {
          type: "array",
          items: { type: "string" },
          description: FERRAMENTA.campos.etiquetas,
        },
      },
      required: ["titulo", "conteudo"],
      additionalProperties: false,
    },
  },
};

async function askOpenAI({
  apiKey,
  model,
  system,
  history,
  blocks,
  signal,
  handlers,
}: AskParams): Promise<void> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

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

  for (let volta = 0; volta < MAX_VOLTAS; volta++) {
    const stream = await client.chat.completions.create(
      { model, messages, tools: [openaiTool], stream: true },
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

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

async function askGemini({
  apiKey,
  model,
  system,
  history,
  blocks,
  handlers,
}: AskParams): Promise<void> {
  const ai = new GoogleGenAI({ apiKey });

  const partesDaPergunta = blocks.map((bloco) =>
    bloco.kind === "text"
      ? { text: bloco.text }
      : { inlineData: { mimeType: bloco.mediaType, data: bloco.base64 } },
  );

  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: partesDaPergunta },
  ];

  const config = {
    systemInstruction: system,
    tools: [
      {
        functionDeclarations: [
          {
            name: FERRAMENTA.nome,
            description: FERRAMENTA.descricao,
            parameters: {
              type: Type.OBJECT,
              properties: {
                titulo: { type: Type.STRING, description: FERRAMENTA.campos.titulo },
                conteudo: { type: Type.STRING, description: FERRAMENTA.campos.conteudo },
                etiquetas: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: FERRAMENTA.campos.etiquetas,
                },
              },
              required: ["titulo", "conteudo"],
            },
          },
        ],
      },
    ],
  };

  for (let volta = 0; volta < MAX_VOLTAS; volta++) {
    const stream = await ai.models.generateContentStream({ model, contents, config });

    const chamadas: Array<{ name: string; args: Record<string, unknown> }> = [];
    for await (const parte of stream) {
      if (parte.text) handlers.onText(parte.text);
      for (const chamada of parte.functionCalls ?? []) {
        if (chamada.name) chamadas.push({ name: chamada.name, args: chamada.args ?? {} });
      }
    }

    if (chamadas.length === 0) return;

    contents.push({
      role: "model",
      parts: chamadas.map((c) => ({ functionCall: { name: c.name, args: c.args } })) as never,
    });
    contents.push({
      role: "user",
      parts: chamadas.map((chamada) => {
        const criada = handlers.onCreateNote(chamada.args as unknown as CreateNoteInput);
        return {
          functionResponse: {
            name: chamada.name,
            response: { resultado: `Nota criada: "${criada.title}" (id ${criada.id})` },
          },
        };
      }) as never,
    });
  }
}

// ---------------------------------------------------------------------------

const IMPLEMENTACOES: Record<ProviderId, (params: AskParams) => Promise<void>> = {
  anthropic: askAnthropic,
  openai: askOpenAI,
  gemini: askGemini,
};

export function askAssistant(provider: ProviderId, params: AskParams): Promise<void> {
  return IMPLEMENTACOES[provider](params);
}

/** O catálogo real do provedor, com a chave de quem está usando. */
export async function listModels(provider: ProviderId, apiKey: string): Promise<string[]> {
  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const pagina = await client.models.list();
    return pagina.data.map((m) => m.id);
  }
  if (provider === "openai") {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const pagina = await client.models.list();
    return pagina.data
      .map((m) => m.id)
      .filter(isChatModel)
      .sort();
  }
  const ai = new GoogleGenAI({ apiKey });
  const pagina = await ai.models.list();
  const ids: string[] = [];
  for await (const modelo of pagina) {
    // O catálogo devolve "models/gemini-...", mas a chamada quer o nome cru.
    if (modelo.name) ids.push(modelo.name.replace(/^models\//, ""));
  }
  return ids.filter(isChatModel).sort();
}

/** Traduz os erros de cada SDK para algo acionável em português. */
export function describeError(error: unknown): string {
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof OpenAI.AuthenticationError
  ) {
    return "Chave de API recusada. Confira se ela está correta e ativa.";
  }
  if (
    error instanceof Anthropic.PermissionDeniedError ||
    error instanceof OpenAI.PermissionDeniedError
  ) {
    return "Essa chave não tem permissão para este modelo.";
  }
  if (error instanceof Anthropic.NotFoundError || error instanceof OpenAI.NotFoundError) {
    return "Modelo não encontrado. Escolha outro na lista de modelos.";
  }
  if (error instanceof Anthropic.RateLimitError || error instanceof OpenAI.RateLimitError) {
    return "Limite de uso atingido. Tente de novo em instantes.";
  }
  if (error instanceof Anthropic.APIConnectionError || error instanceof OpenAI.APIConnectionError) {
    return "Não foi possível falar com a API. Verifique sua conexão.";
  }
  if (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) {
    return error.message || "A API devolveu um erro.";
  }
  // O SDK do Gemini não expõe classes de erro tipadas; sobra a mensagem.
  return error instanceof Error ? error.message : "Algo deu errado.";
}
