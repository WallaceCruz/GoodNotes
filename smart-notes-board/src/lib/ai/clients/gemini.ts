import { GoogleGenAI, Type } from "@google/genai";
import { isChatModel } from "@/lib/ai/providers";
import {
  CREATE_NOTE_TOOL,
  MAX_TOOL_ROUNDS,
  type AiClient,
  type AskParams,
  type CreateNoteInput,
} from "@/lib/ai/types";

/**
 * O Gemini.
 *
 * Só este arquivo conhece o SDK do Google. O resto do app fala com `AiClient`.
 */

const config = {
  tools: [
    {
      functionDeclarations: [
        {
          name: CREATE_NOTE_TOOL.name,
          description: CREATE_NOTE_TOOL.description,
          parameters: {
            type: Type.OBJECT,
            properties: {
              titulo: { type: Type.STRING, description: CREATE_NOTE_TOOL.fields.titulo },
              conteudo: { type: Type.STRING, description: CREATE_NOTE_TOOL.fields.conteudo },
              etiquetas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: CREATE_NOTE_TOOL.fields.etiquetas,
              },
            },
            required: ["titulo", "conteudo"],
          },
        },
      ],
    },
  ],
};

async function ask({ apiKey, model, system, history, blocks, handlers }: AskParams): Promise<void> {
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

  for (let volta = 0; volta < MAX_TOOL_ROUNDS; volta++) {
    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config: { ...config, systemInstruction: system },
    });

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

async function listModels(apiKey: string): Promise<string[]> {
  const pagina = await new GoogleGenAI({ apiKey }).models.list();
  const ids: string[] = [];
  for await (const modelo of pagina) {
    // O catálogo devolve "models/gemini-...", mas a chamada quer o nome cru.
    if (modelo.name) ids.push(modelo.name.replace(/^models\//, ""));
  }
  return ids.filter(isChatModel).sort();
}

/**
 * O SDK do Google não expõe classes de erro tipadas — só uma `Error` cuja
 * mensagem é o JSON cru da resposta. Sem isto, a tela mostrava
 * `{"error":{"code":400,...}}` para quem só errou a chave.
 */
function describeError(error: unknown): string | null {
  if (!(error instanceof Error)) return null;

  const corpo = error.message.slice(error.message.indexOf("{"));
  let status = "";
  let mensagem = "";
  try {
    const json = JSON.parse(corpo) as { error?: { status?: string; message?: string } };
    status = json.error?.status ?? "";
    mensagem = json.error?.message ?? "";
  } catch {
    mensagem = error.message;
  }

  if (status === "INVALID_ARGUMENT" && /api key/i.test(mensagem)) {
    return "Chave de API recusada. Confira se ela está correta e ativa.";
  }
  if (status === "PERMISSION_DENIED") return "Essa chave não tem permissão para este modelo.";
  if (status === "NOT_FOUND") return "Modelo não encontrado. Escolha outro na lista de modelos.";
  if (status === "RESOURCE_EXHAUSTED") return "Limite de uso atingido. Tente de novo em instantes.";
  if (status === "UNAVAILABLE") return "O serviço está indisponível agora. Tente de novo.";
  return mensagem || null;
}

export const geminiClient: AiClient = { ask, listModels, describeError };
