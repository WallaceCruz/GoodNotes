import type { AiClient, AskParams, ProviderId } from "@/lib/ai/types";

/**
 * O registro de provedores.
 *
 * Este arquivo é a única porta entre a interface e os SDKs — e não importa
 * nenhum deles. Cada implementação entra por `import()`, então escolher a
 * Anthropic não baixa o código da OpenAI nem o do Gemini, e acrescentar um
 * quarto provedor é uma linha aqui mais um arquivo em `clients/`.
 *
 * Todos rodam direto do navegador, porque o app não tem servidor. A chave fica
 * na máquina de quem usa e é legível por qualquer script desta página — o aviso
 * está na tela de configuração.
 */

const CARREGADORES: Record<ProviderId, () => Promise<AiClient>> = {
  anthropic: () => import("@/lib/ai/clients/anthropic").then((m) => m.anthropicClient),
  openai: () => import("@/lib/ai/clients/openai").then((m) => m.openaiClient),
  gemini: () => import("@/lib/ai/clients/gemini").then((m) => m.geminiClient),
};

// Uma vez baixado, o módulo fica: o navegador já faz esse cache, mas guardar a
// promessa evita duas requisições em paralelo no primeiro envio.
const emMemoria = new Map<ProviderId, Promise<AiClient>>();

function clientFor(provider: ProviderId): Promise<AiClient> {
  const existente = emMemoria.get(provider);
  if (existente) return existente;
  const carregando = CARREGADORES[provider]();
  emMemoria.set(provider, carregando);
  return carregando;
}

export async function askAssistant(provider: ProviderId, params: AskParams): Promise<void> {
  const client = await clientFor(provider);
  return client.ask(params);
}

/** O catálogo real do provedor, com a chave de quem está usando. */
export async function listModels(provider: ProviderId, apiKey: string): Promise<string[]> {
  const client = await clientFor(provider);
  return client.listModels(apiKey);
}

/**
 * Traduz o erro para algo acionável em português.
 *
 * Só o provedor sabe reconhecer os erros do próprio SDK; quando ele não
 * reconhece, sobra a mensagem que veio.
 */
export async function describeError(provider: ProviderId, error: unknown): Promise<string> {
  const client = await clientFor(provider);
  return (
    client.describeError(error) ?? (error instanceof Error ? error.message : "Algo deu errado.")
  );
}

export type {
  AskParams,
  ChatMessage,
  ChatRole,
  ContextBlock,
  CreateNoteInput,
  StreamHandlers,
} from "@/lib/ai/types";
