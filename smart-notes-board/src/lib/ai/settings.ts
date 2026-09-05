import { useCallback } from "react";
import { useLocalStore } from "@/hooks/useLocalStore";

/**
 * Configuração do assistente.
 *
 * A chave da API fica no navegador de quem usa, porque não há servidor onde
 * guardá-la. Isso é uma escolha com consequência: qualquer script que rode
 * nesta página — uma extensão, um XSS — consegue lê-la. A tela de configuração
 * diz isso em voz alta, e a chave nunca sai daqui a não ser para a Anthropic.
 */

export type AiModel = "claude-opus-5" | "claude-sonnet-5" | "claude-haiku-4-5";

export const AI_MODELS: Array<{ id: AiModel; label: string; hint: string }> = [
  { id: "claude-opus-5", label: "Opus 5", hint: "O mais capaz — melhor para escrever e analisar" },
  { id: "claude-sonnet-5", label: "Sonnet 5", hint: "Equilíbrio entre custo e qualidade" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", hint: "O mais rápido e barato" },
];

export type AiSettings = {
  apiKey: string;
  model: AiModel;
};

const KEY = "sticky-flow:assistant";

export const defaultAiSettings: AiSettings = {
  apiKey: "",
  model: "claude-opus-5",
};

function parseSettings(raw: unknown): AiSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<AiSettings>;
  const model = AI_MODELS.some((m) => m.id === value.model)
    ? (value.model as AiModel)
    : defaultAiSettings.model;
  return { apiKey: typeof value.apiKey === "string" ? value.apiKey : "", model };
}

export function useAiSettings() {
  const { value: settings, setValue } = useLocalStore({
    key: KEY,
    fallback: defaultAiSettings,
    parse: parseSettings,
    label: "assistente",
  });

  const update = useCallback(
    (patch: Partial<AiSettings>) => setValue((current) => ({ ...current, ...patch })),
    [setValue],
  );

  const clearKey = useCallback(
    () => setValue((current) => ({ ...current, apiKey: "" })),
    [setValue],
  );

  return { settings, update, clearKey, configured: settings.apiKey.trim().length > 0 };
}
