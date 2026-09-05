import { useEffect, useRef, useState } from "react";
import type Anthropic from "@anthropic-ai/sdk";
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  FileText,
  PanelLeft,
  Paperclip,
  Plus,
  Settings2,
  Square,
  SquarePen,
  StickyNote,
  X,
} from "lucide-react";
import {
  askAssistant,
  describeError,
  type ChatMessage,
  type ContextBlock,
} from "@/lib/ai/assistant";
import {
  SYSTEM_PROMPT,
  describeExtras,
  describeScope,
  scopeLabel,
  type AiScope,
} from "@/lib/ai/context";
import { SUGGESTIONS } from "@/lib/ai/suggestions";
import { attachmentBlocks, fileBlocks } from "@/lib/ai/attachments";
import { useAiSettings } from "@/lib/ai/settings";
import { PROVIDERS, providerInfo } from "@/lib/ai/providers";
import { useConversations, type Conversation } from "@/lib/ai/history";
import { AssistantSettings } from "./AssistantSettings";
import { ClaudeMark } from "./ClaudeMark";
import { ConversationList } from "./ConversationList";
import { NotePicker } from "./NotePicker";
import { boardActions, useActiveFile } from "@/stores/board";
import type { Note } from "@/lib/board/model";
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
  const { settings, apiKey, model, setProvider, setModel, configured } = useAiSettings();
  const [showSettings, setShowSettings] = useState(!configured);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotePicker, setShowNotePicker] = useState(false);

  // O que a pessoa juntou a mais: notas do quadro e arquivos soltos no chat.
  const [extraNotes, setExtraNotes] = useState<Note[]>([]);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);

  const { conversations, save, remove } = useConversations();
  const [conversationId, setConversationId] = useState(() => uid());
  const activeFile = useActiveFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const abortRef = useRef<AbortController | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const contexto = scopeLabel(scope);
  const provedor = providerInfo(settings.provider);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Guarda ao fim de cada resposta, nao a cada pedaco do streaming.
  useEffect(() => {
    if (!running) save(conversationId, messages);
  }, [running, messages, conversationId, save]);

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

    // Anexos da nota e arquivos soltos no chat viram blocos próprios: PDF a API
    // lê como documento, texto vai como texto. O que não couber é avisado.
    const daNota = await attachmentBlocks(scope.kind === "note" ? scope.note.attachments : []);
    const doChat = await fileBlocks(extraFiles);
    const recusados = [...daNota.skipped, ...doChat.skipped];
    if (recusados.length) {
      setMessages((atuais) =>
        atuais.map((m) =>
          m.id === resposta.id
            ? { ...m, text: `_Anexos não enviados: ${recusados.join(", ")}._\n\n` }
            : m,
        ),
      );
    }

    const partes = [describeScope(scope), describeExtras(extraNotes)].filter(Boolean);
    const contextoTexto = partes.join("\n\n");
    const blocos: ContextBlock[] = [
      ...daNota.blocks,
      ...doChat.blocks,
      {
        kind: "text",
        text: contextoTexto ? `<contexto>\n${contextoTexto}\n</contexto>\n\n${pergunta}` : pergunta,
      },
    ];

    try {
      await askAssistant(settings.provider, {
        apiKey,
        model,
        system: SYSTEM_PROMPT,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        blocks: blocos,
        signal: controller.signal,
        handlers: {
          onText: (chunk: string) =>
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

  /** Zera tudo o que pertence à conversa, menos as preferências. */
  const novoChat = () => {
    setConversationId(uid());
    setMessages([]);
    setExtraNotes([]);
    setExtraFiles([]);
    setError(null);
    setExpanded(false);
    setShowHistory(false);
    setShowSettings(false);
  };

  const abrirConversa = (conversa: Conversation) => {
    setConversationId(conversa.id);
    setMessages(conversa.messages);
    // Anexos soltos não são guardados; a conversa volta sem eles.
    setExtraFiles([]);
    setError(null);
    setShowHistory(false);
  };

  const alternarNota = (note: Note) =>
    setExtraNotes((atuais) =>
      atuais.some((n) => n.id === note.id)
        ? atuais.filter((n) => n.id !== note.id)
        : [...atuais, note],
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-5">
      <button aria-label="Fechar assistente" onClick={onClose} className="absolute inset-0" />

      {/* Alto o bastante para a conversa não rolar a cada duas respostas, sem
          encostar nas bordas da janela. */}
      <div className="relative flex h-[min(90vh,52rem)] w-full max-w-[27rem] flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
        {/* Cabeçalho: menu à esquerda, o chat ao centro, fechar à direita. */}
        <header className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={() => setShowHistory((v) => !v)}
            aria-label="Conversas anteriores"
            title="Conversas anteriores"
            className={cn(
              "relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent",
              showHistory && "bg-accent text-foreground",
            )}
          >
            <PanelLeft className="h-[18px] w-[18px]" />
            {conversations.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>

          <span className="flex flex-1 justify-center">
            <button
              onClick={novoChat}
              className="flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-accent"
            >
              <SquarePen className="h-3.5 w-3.5" />
              Novo chat
            </button>
          </span>

          {/* A chave da API se configura aqui. Sem este botão, a tela só
              aparecia na primeira abertura, quando ainda não havia chave —
              trocar de modelo ou de chave depois ficava sem caminho. */}
          <button
            onClick={() => {
              setShowSettings((v) => !v);
              setShowHistory(false);
              setShowNotePicker(false);
            }}
            aria-label="Configurações da API"
            title="Configurações da API"
            className={cn(
              "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent",
              showSettings && "bg-accent text-foreground",
            )}
          >
            <Settings2 className="h-[18px] w-[18px]" />
          </button>

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
                          {settings.provider === "anthropic" && <ClaudeMark className="h-3 w-3" />}
                          {provedor.label}
                          <span className="text-muted-foreground/70">{model}</span>
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

                {/* O que foi juntado a mais, cada um removível — quem anexou
                    por engano não precisa recomeçar a conversa. */}
                {(extraNotes.length > 0 || extraFiles.length > 0) && (
                  <div className="mb-1 flex flex-wrap gap-1 px-0.5">
                    {extraNotes.map((note) => (
                      <span
                        key={note.id}
                        className="flex max-w-full items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px]"
                      >
                        <StickyNote className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{note.title || "Sem título"}</span>
                        <button
                          onClick={() => alternarNota(note)}
                          aria-label={`Remover ${note.title || "nota"} do contexto`}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {extraFiles.map((arquivo, i) => (
                      <span
                        key={`${arquivo.name}-${i}`}
                        className="flex max-w-full items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px]"
                      >
                        <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{arquivo.name}</span>
                        <button
                          onClick={() =>
                            setExtraFiles((atuais) => atuais.filter((_, j) => j !== i))
                          }
                          aria-label={`Remover ${arquivo.name} do contexto`}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
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
                  {/* O "+" junta contexto à conversa: notas do quadro ou um
                      arquivo do computador. */}
                  <div className="relative">
                    <button
                      onClick={() => setAddOpen((v) => !v)}
                      aria-label="Adicionar contexto"
                      aria-expanded={addOpen}
                      title="Adicionar notas ou documentos"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    {addOpen && (
                      <div className="absolute bottom-full left-0 z-10 mb-1.5 w-52 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                        <button
                          onClick={() => {
                            setAddOpen(false);
                            setShowNotePicker(true);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-accent"
                        >
                          <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground" />
                          Escolher notas
                        </button>
                        <button
                          onClick={() => {
                            setAddOpen(false);
                            fileInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-accent"
                        >
                          <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                          Anexar documento
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(event) => {
                      setExtraFiles((atuais) => [
                        ...atuais,
                        ...Array.from(event.target.files ?? []),
                      ]);
                      event.target.value = "";
                    }}
                  />

                  {/* O modelo é escolhido aqui, onde a mensagem é escrita. */}
                  <div className="relative">
                    <button
                      onClick={() => setModelOpen((v) => !v)}
                      aria-expanded={modelOpen}
                      className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-accent"
                    >
                      {settings.provider === "anthropic" && (
                        <ClaudeMark className="h-3.5 w-3.5 text-[#cc785c]" />
                      )}
                      <span className="max-w-[9rem] truncate">{model}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>

                    {/* Trocar de provedor aqui é o caminho curto; a lista
                        completa de modelos vive nas configurações, junto da
                        chave que dá acesso a ela. */}
                    {modelOpen && (
                      <div className="absolute bottom-full left-0 z-10 mb-1.5 w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                        {PROVIDERS.map((p) => {
                          const temChave = settings.keys[p.id].trim().length > 0;
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                setProvider(p.id);
                                setModelOpen(false);
                                if (!temChave) setShowSettings(true);
                              }}
                              className={cn(
                                "block w-full px-3 py-2 text-left transition-colors hover:bg-accent",
                                settings.provider === p.id && "bg-accent",
                              )}
                            >
                              <span className="block text-[12px] font-medium">{p.label}</span>
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {temChave ? settings.models[p.id] : "Sem chave configurada"}
                              </span>
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            setModelOpen(false);
                            setShowSettings(true);
                          }}
                          className="block w-full border-t border-border px-3 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent"
                        >
                          Escolher outro modelo…
                        </button>
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

        {showHistory && (
          <ConversationList
            conversations={conversations}
            activeId={conversationId}
            onOpen={abrirConversa}
            onRemove={remove}
            onClose={() => setShowHistory(false)}
          />
        )}

        {showNotePicker && (
          <NotePicker
            notes={activeFile?.notes ?? []}
            selectedIds={extraNotes.map((n) => n.id)}
            onToggle={alternarNota}
            onClose={() => setShowNotePicker(false)}
          />
        )}
      </div>
    </div>
  );
}
