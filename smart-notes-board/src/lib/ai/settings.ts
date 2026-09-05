import { useCallback } from "react";
import { useLocalStore } from "@/hooks/useLocalStore";
import { PROVIDERS, providerInfo, type ProviderId } from "@/lib/ai/providers";

/**
 * Configuração do assistente.
 *
 * As chaves ficam no navegador de quem usa, porque não há servidor onde
 * guardá-las. Isso é uma escolha com consequência: qualquer script que rode
 * nesta página — uma extensão, um XSS — consegue lê-las. A tela de configuração
 * diz isso em voz alta, e cada chave só sai daqui para o provedor dela.
 *
 * Chave e modelo são guardados por provedor: quem configurou os três troca
 * entre eles sem colar nada de novo.
 */

export type AiSettings = {
  provider: ProviderId;
  keys: Record<ProviderId, string>;
  models: Record<ProviderId, string>;
};

const KEY = "sticky-flow:assistant";

const vazio = <T>(valor: T): Record<ProviderId, T> => ({
  anthropic: valor,
  openai: valor,
  gemini: valor,
});

export const defaultAiSettings: AiSettings = {
  provider: "anthropic",
  keys: vazio(""),
  models: {
    anthropic: providerInfo("anthropic").defaultModel,
    openai: providerInfo("openai").defaultModel,
    gemini: providerInfo("gemini").defaultModel,
  },
};

function parseSettings(raw: unknown): AiSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const valor = raw as Record<string, unknown>;

  // Versão anterior guardava uma chave só, do Claude, em `apiKey`/`model`.
  if (typeof valor["apiKey"] === "string") {
    return {
      ...defaultAiSettings,
      keys: { ...vazio(""), anthropic: valor["apiKey"] },
      models: {
        ...defaultAiSettings.models,
        anthropic:
          typeof valor["model"] === "string" ? valor["model"] : defaultAiSettings.models.anthropic,
      },
    };
  }

  const provider = PROVIDERS.some((p) => p.id === valor["provider"])
    ? (valor["provider"] as ProviderId)
    : defaultAiSettings.provider;
  const guardadas = (campo: unknown, padrao: Record<ProviderId, string>) => {
    const obj = (campo ?? {}) as Partial<Record<ProviderId, unknown>>;
    return {
      anthropic: typeof obj.anthropic === "string" ? obj.anthropic : padrao.anthropic,
      openai: typeof obj.openai === "string" ? obj.openai : padrao.openai,
      gemini: typeof obj.gemini === "string" ? obj.gemini : padrao.gemini,
    };
  };

  return {
    provider,
    keys: guardadas(valor["keys"], vazio("")),
    models: guardadas(valor["models"], defaultAiSettings.models),
  };
}

export function useAiSettings() {
  const { value: settings, setValue } = useLocalStore({
    key: KEY,
    fallback: defaultAiSettings,
    parse: parseSettings,
    label: "assistente",
  });

  const setProvider = useCallback(
    (provider: ProviderId) => setValue((atual) => ({ ...atual, provider })),
    [setValue],
  );

  const setKey = useCallback(
    (provider: ProviderId, apiKey: string) =>
      setValue((atual) => ({ ...atual, keys: { ...atual.keys, [provider]: apiKey } })),
    [setValue],
  );

  const setModel = useCallback(
    (provider: ProviderId, model: string) =>
      setValue((atual) => ({ ...atual, models: { ...atual.models, [provider]: model } })),
    [setValue],
  );

  const apiKey = settings.keys[settings.provider];
  const model = settings.models[settings.provider];

  return {
    settings,
    apiKey,
    model,
    setProvider,
    setKey,
    setModel,
    /** `true` quando o provedor escolhido tem chave. */
    configured: apiKey.trim().length > 0,
  };
}
