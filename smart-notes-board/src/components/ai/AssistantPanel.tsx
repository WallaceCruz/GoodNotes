import { useEffect, useRef, useState } from "react";
import type Anthropic from "@anthropic-ai/sdk";
import { ArrowUp, FileText, Settings2, Sparkles, Square, StickyNote, X } from "lucide-react";
import { askAssistant, createClient, describeError, type ChatMessage } from "@/lib/ai/assistant";
import { SYSTEM_PROMPT, describeScope, scopeLabel, type AiScope } from "@/lib/ai/context";
import { SUGGESTIONS } from "@/lib/ai/suggestions";
import { attachmentBlocks } from "@/lib/ai/attachments";
import { useAiSettings } from "@/lib/ai/settings";
import { AssistantSettings } from "./AssistantSettings";
import { boardActions } from "@/stores/board";
import { uid } from "@/lib/id";
import { cn } from "@/lib/utils";

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
  const { settings, configured } = useAiSettings();
  const [showSettings, setShowSettings] = useState(!configured);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const contexto = scopeLabel(scope);

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

  const sugestoes = expanded ? SUGGESTIONS : SUGGESTIONS.slice(0, 6);
  const vazio = messages.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-5">
      <button aria-label="Fechar assistente" onClick={onClose} className="absolute inset-0" />

      <div className="relative flex h-[min(78vh,40rem)] w-full max-w-[26rem] flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="flex-1 text-sm font-semibold">Assistente</h2>
          <button
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Configurações do assistente"
            title="Configurações"
            className={cn(
              "rounded-md p-1.5 text-muted-foreground hover:bg-accent",
              showSettings && "bg-accent text-foreground",
            )}
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {showSettings ? (
          <div className="scroll-thin flex-1 overflow-y-auto">
            <AssistantSettings onDone={() => setShowSettings(false)} />
          </div>
        ) : (
          <>
            <div className="scroll-thin flex-1 overflow-y-auto px-3 py-3">
              {vazio && (
                <>
                  <p className="px-1 pb-1.5 text-[13px] font-semibold">Sugestões</p>
                  <ul>
                    {sugestoes.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() =>
                            s.needsScope ? void enviar(s.prompt) : setDraft(s.prompt)
                          }
                          disabled={s.needsScope && !contexto}
                          className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-2 text-left text-[13px] transition-colors hover:bg-accent disabled:opacity-40"
                        >
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {s.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 px-1.5 py-1 text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    {expanded ? "Mostrar menos" : "Mostrar mais"}
                  </button>
                </>
              )}

              {messages.map((m) => (
                <div key={m.id} className={cn("mb-3", m.role === "user" && "flex justify-end")}>
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

            <div className="border-t border-border p-2.5">
              {contexto && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">{contexto.title}</span>
                    <span className="block text-[10px] text-muted-foreground">{contexto.hint}</span>
                  </span>
                </div>
              )}

              <div className="flex items-end gap-1.5">
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
                  className="scroll-thin min-h-[2.5rem] w-full resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-[13px] outline-none focus:border-primary"
                />
                {running ? (
                  <button
                    onClick={() => abortRef.current?.abort()}
                    aria-label="Parar"
                    title="Parar"
                    className="mb-0.5 shrink-0 rounded-lg bg-muted p-2 text-foreground"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => void enviar(draft)}
                    disabled={!draft.trim()}
                    aria-label="Enviar"
                    className="mb-0.5 shrink-0 rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
