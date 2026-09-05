import { useEffect, useRef, useState } from "react";
import type Anthropic from "@anthropic-ai/sdk";
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  FileText,
  PanelLeft,
  Plus,
  Square,
  StickyNote,
  X,
} from "lucide-react";
import { askAssistant, createClient, describeError, type ChatMessage } from "@/lib/ai/assistant";
import { SYSTEM_PROMPT, describeScope, scopeLabel, type AiScope } from "@/lib/ai/context";
import { SUGGESTIONS } from "@/lib/ai/suggestions";
import { attachmentBlocks } from "@/lib/ai/attachments";
import { AI_MODELS, useAiSettings } from "@/lib/ai/settings";
import { AssistantSettings } from "./AssistantSettings";
import { ClaudeMark } from "./ClaudeMark";
import { boardActions } from "@/stores/board";
import { uid } from "@/lib/id";
import { cn } from "@/lib/utils";

/** Quantas sugestões cabem antes de "Mostrar mais". */
const VISIVEIS = 6;

/** O texto do modelo com um mínimo de formatação: negrito e listas. */
function Markdown({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
      {text.split("\n").map((linha, i) => {
        const item = /^\s*[-*]\s+(.*)$/.exec(linha);
        const conteudo = item ? item[1]! : linha;
        const partes = conteudo
          .split(/(\*\*[^*]+\*\*)/g)
          .map((parte, j) =>
            parte.startsWith("**") && parte.endsWith("**") ? (
              <strong key={j}>{parte.slice(2, -2)}</strong>
            ) : (
              parte
            ),
          );
        return (
          <p key={i} className={cn(item && "flex gap-1.5 pl-1")}>
            {item && <span aria-hidden>-</span>}
            <span>{partes}</span>
          </p>
        );
      })}
    </div>
  );
}

/**
 * A conversa com o assistente.
 *
 * O contexto entra na mensagem, e não no prompt de sistema: trocar de nota não
 * deve invalidar o prefixo que a API mantém em cache.
 */
export function AssistantPanel({ scope, onClose }: { scope: AiScope; onClose: () => void }) {
  const { settings, update, configured } = useAiSettings();
  const [showSettings, setShowSettings] = useState(!configured);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const contexto = scopeLabel(scope);
  const modelo = AI_MODELS.find((m) => m.id === settings.model);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !running) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, running]);

  const enviar = async (texto: string) => {
    const pergunta = texto.trim();
    if (!pergunta || running) return;

    setError(null);
    setDraft("");
    const minha: ChatMessage = { id: uid(), role: "user", text: pergunta };
    const resposta: ChatMessage = { id: uid(), role: "assistant", text: "" };
    setMessages((atuais) => [...atuais, minha, resposta]);
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Os anexos da nota entram como blocos próprios: PDF a API lê como
    // documento, texto vai como texto. O que não couber é avisado, não omitido.
    const { blocks: anexos, skipped } = await attachmentBlocks(
      scope.kind === "note" ? scope.note.attachments : [],
    );
    if (skipped.length) {
      setMessages((atuais) =>
        atuais.map((m) =>
          m.id === resposta.id
            ? { ...m, text: `_Anexos não enviados: ${skipped.join(", ")}._\n\n` }
            : m,
        ),
      );
    }

    const descricao = describeScope(scope);
    const historico: Anthropic.MessageParam[] = [
      ...messages.map((m) => ({ role: m.role, content: m.text })),
      {
        role: "user" as const,
        content: [
          ...anexos,
          {
            type: "text" as const,
            text: descricao ? `<contexto>\n${descricao}\n</contexto>\n\n${pergunta}` : pergunta,
          },
        ],
      },
    ];

    try {
      await askAssistant({
        client: createClient(settings.apiKey),
        model: settings.model,
        system: SYSTEM_PROMPT,
        history: historico,
        signal: controller.signal,
        handlers: {
          onText: (chunk) =>
            setMessages((atuais) =>
              atuais.map((m) => (m.id === resposta.id ? { ...m, text: m.text + chunk } : m)),
            ),
          onCreateNote: (input) => {
            const id = boardActions.addNoteFromAssistant(
              input.titulo,
              input.conteudo,
              input.etiquetas ?? [],
            );
            setMessages((atuais) =>
              atuais.map((m) =>
                m.id === resposta.id
                  ? { ...m, createdNotes: [...(m.createdNotes ?? []), { id, title: input.titulo }] }
                  : m,
              ),
            );
            return { id, title: input.titulo };
          },
        },
      });
    } catch (erro) {
      if (!controller.signal.aborted) setError(describeError(erro));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const sugestoes = expanded ? SUGGESTIONS : SUGGESTIONS.slice(0, VISIVEIS);
  const vazio = messages.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-5">
      <button aria-label="Fechar assistente" onClick={onClose} className="absolute inset-0" />

      <div className="relative flex h-[min(80vh,42rem)] w-full max-w-[26rem] flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
        {/* Cabeçalho: menu à esquerda, o chat ao centro, fechar à direita. */}
        <header className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Configurações do assistente"
            title="Configurações"
            className={cn(
              "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent",
              showSettings && "bg-accent text-foreground",
            )}
          >
            <PanelLeft className="h-[18px] w-[18px]" />
          </button>

          <span className="flex flex-1 justify-center">
            <button
              onClick={() => {
                setMessages([]);
                setError(null);
                setExpanded(false);
                setShowSettings(false);
              }}
              className="rounded-full bg-muted px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-accent"
            >
              Novo chat
            </button>
          </span>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </header>

        {showSettings ? (
          <div className="scroll-thin flex-1 overflow-y-auto">
            <AssistantSettings onDone={() => setShowSettings(false)} />
          </div>
        ) : (
          <>
            <div className="scroll-thin flex flex-1 flex-col overflow-y-auto px-3">
              {vazio ? (
                // A lista fica ancorada embaixo, como no exemplo: o espaço em
                // branco acima é onde a conversa vai crescer.
                <div className="mt-auto pb-2">
                  <p className="px-1.5 pb-1 text-[15px] font-semibold">Sugestões</p>
                  <ul>
                    {sugestoes.map(({ id, label, icon: Icon, prompt, needsScope }) => (
                      <li key={id}>
                        <button
                          onClick={() => (needsScope ? void enviar(prompt) : setDraft(prompt))}
                          disabled={needsScope && !contexto}
                          className="flex w-full items-center gap-3 rounded-lg px-1.5 py-[7px] text-left text-[14px] transition-colors hover:bg-accent disabled:opacity-40"
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex w-full items-center gap-3 rounded-lg px-1.5 py-[7px] text-left text-[14px] text-muted-foreground transition-colors hover:bg-accent"
                  >
                    {expanded ? (
                      <ChevronUp className="h-[18px] w-[18px] shrink-0" />
                    ) : (
                      <ChevronDown className="h-[18px] w-[18px] shrink-0" />
                    )}
                    {expanded ? "Mostrar menos" : "Mostrar mais"}
                  </button>
                </div>
              ) : (
                <div className="py-3">
                  {messages.map((m) => (
                    <div key={m.id} className={cn("mb-3", m.role === "user" && "flex justify-end")}>
                      {m.role === "assistant" && (
                        <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <ClaudeMark className="h-3 w-3" />
                          {modelo?.label ?? "Claude"}
                        </span>
                      )}
                      <div
                        className={cn(
                          "max-w-[92%] rounded-xl px-3 py-2",
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        {m.text ? (
                          <Markdown text={m.text} />
                        ) : (
                          <span className="flex gap-1 py-1" aria-label="Escrevendo">
                            {[0, 150, 300].map((atraso) => (
                              <span
                                key={atraso}
                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40"
                                style={{ animationDelay: `${atraso}ms` }}
                              />
                            ))}
                          </span>
                        )}

                        {m.createdNotes?.map((nota) => (
                          <span
                            key={nota.id}
                            className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                          >
                            <StickyNote className="h-3 w-3 shrink-0 text-primary" />
                            <span className="truncate">{nota.title}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {error && (
                    <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                      {error}
                    </p>
                  )}
                  <div ref={fimRef} />
                </div>
              )}
            </div>

            {/* Um cartão só: contexto, campo e controles moram juntos. */}
            <div className="p-3">
              <div className="rounded-xl border border-border bg-background p-2 focus-within:border-foreground/25">
                {contexto && (
                  <div className="mb-1 flex items-center gap-2 rounded-lg bg-muted px-2 py-1.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold">
                        {contexto.title}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {contexto.hint}
                      </span>
                    </span>
                  </div>
                )}

                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void enviar(draft);
                    }
                  }}
                  rows={2}
                  placeholder="Envie uma mensagem ao assistente"
                  aria-label="Mensagem para o assistente"
                  className="scroll-thin w-full resize-none bg-transparent px-1.5 py-1.5 text-[14px] outline-none placeholder:text-muted-foreground"
                />

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowSettings(true)}
                    aria-label="Configurações"
                    title="Configurações"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  {/* O modelo é escolhido aqui, onde a mensagem é escrita. */}
                  <div className="relative">
                    <button
                      onClick={() => setModelOpen((v) => !v)}
                      aria-expanded={modelOpen}
                      className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-accent"
                    >
                      <ClaudeMark className="h-3.5 w-3.5 text-[#cc785c]" />
                      {modelo?.label ?? "Modelo"}
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>

                    {modelOpen && (
                      <div className="absolute bottom-full left-0 z-10 mb-1.5 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                        {AI_MODELS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              update({ model: m.id });
                              setModelOpen(false);
                            }}
                            className={cn(
                              "block w-full px-3 py-2 text-left transition-colors hover:bg-accent",
                              settings.model === m.id && "bg-accent",
                            )}
                          >
                            <span className="block text-[12px] font-medium">{m.label}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              {m.hint}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="flex-1" />

                  {running ? (
                    <button
                      onClick={() => abortRef.current?.abort()}
                      aria-label="Parar"
                      title="Parar"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
                    >
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => void enviar(draft)}
                      disabled={!draft.trim()}
                      aria-label="Enviar"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
