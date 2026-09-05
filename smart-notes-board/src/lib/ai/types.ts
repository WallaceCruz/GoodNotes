import type { ProviderId } from "@/lib/ai/providers";

/**
 * O contrato do assistente, sem nenhum SDK.
 *
 * Este módulo existe para quebrar uma dependência que custava caro: antes os
 * tipos moravam junto das implementações, então quem precisava só de
 * `ChatMessage` — o histórico, por exemplo — arrastava os três SDKs de IA
 * junto. Aqui não há import de fornecedor nenhum, e quem depende só do formato
 * depende só disto.
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

/**
 * O que todo provedor sabe fazer.
 *
 * A tela conversa com esta interface, nunca com um SDK. Trocar de fornecedor,
 * ou acrescentar um quarto, não toca em nada acima desta linha.
 */
export type AiClient = {
  ask: (params: AskParams) => Promise<void>;
  listModels: (apiKey: string) => Promise<string[]>;
  /** Mensagem em português para os erros que este provedor conhece. */
  describeError: (error: unknown) => string | null;
};

/** A ferramenta de criar nota, descrita uma vez e traduzida por cada provedor. */
export const CREATE_NOTE_TOOL = {
  name: "criar_nota",
  description:
    "Cria uma nota autoadesiva no arquivo aberto. Use sempre que a pessoa pedir para criar, anotar ou registrar algo — nunca escreva a nota na resposta pedindo que copiem.",
  fields: {
    titulo: "Título curto e específico.",
    conteudo: "Corpo da nota. Aceita markdown simples.",
    etiquetas: "Etiquetas em minúsculas, opcional.",
  },
} as const;

/** Quantas voltas de ferramenta antes de desistir — evita laço infinito. */
export const MAX_TOOL_ROUNDS = 6;

export type { ProviderId };
