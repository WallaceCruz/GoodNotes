/**
 * Os provedores de IA que o assistente sabe usar.
 *
 * Cada um tem SDK, formato de chave e catálogo de modelos próprios. Os nomes
 * de modelo mudam com frequência, então a lista padrão aqui é só um ponto de
 * partida: a tela de configuração busca o catálogo real com a chave da pessoa,
 * e ainda aceita um id digitado à mão para quem tem acesso a algo fora da lista.
 */

export type ProviderId = "anthropic" | "openai" | "gemini";

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  /** Modelo usado enquanto ninguém escolheu outro. */
  defaultModel: string;
  /** Sugestões enquanto o catálogo real não foi buscado. */
  fallbackModels: string[];
  keyPlaceholder: string;
  keysUrl: string;
  keysLabel: string;
};

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    label: "Claude",
    defaultModel: "claude-opus-5",
    fallbackModels: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
    keyPlaceholder: "sk-ant-...",
    keysUrl: "https://console.anthropic.com/settings/keys",
    keysLabel: "console da Anthropic",
  },
  {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    keyPlaceholder: "sk-...",
    keysUrl: "https://platform.openai.com/api-keys",
    keysLabel: "painel da OpenAI",
  },
  {
    id: "gemini",
    label: "Gemini",
    defaultModel: "gemini-2.0-flash",
    fallbackModels: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    keyPlaceholder: "AIza...",
    keysUrl: "https://aistudio.google.com/apikey",
    keysLabel: "Google AI Studio",
  },
];

export function providerInfo(id: ProviderId): ProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]!;
}

/** Modelos que servem para conversar, separados dos de imagem, áudio e afins. */
export function isChatModel(id: string): boolean {
  return !/embedding|whisper|tts|dall-e|moderation|image|audio|vision-preview|aqa/i.test(id);
}
