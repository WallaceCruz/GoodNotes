import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Archive,
  ArchiveRestore,
  Bold,
  Code,
  Copy,
  Film,
  GripVertical,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Pin,
  PinOff,
  Quote,
  RemoveFormatting,
  Strikethrough,
  Trash2,
  Underline as UnderlineIcon,
  X,
} from "lucide-react";
import {
  noteAssignees,
  NOTE_COLORS,
  PRIORITIES,
  PRIORITY_ICON,
  PRIORITY_LABEL,
  type Note,
} from "@/lib/board-types";
import { boardActions, useActiveFile, useActiveProject, useFileColumns } from "@/stores/board";
import { AssigneeSelect } from "./AssigneeSelect";
import { DeadlinePicker } from "./DeadlinePicker";
import { TagEditor } from "./TagEditor";
import { StatusSelect } from "./StatusSelect";
import { CategorySelect } from "./CategorySelect";
import { cn } from "@/lib/utils";
import {
  BLOCK_DRAG_MIME,
  TEXT_BLOCKS,
  insertBlock,
  insertMediaFiles,
  insertMediaUrl,
  insertTable,
} from "./editor-blocks";
import { noteBg, noteLabel, priorityClass, timeAgo } from "./note-style";

const TABS = ["Inserir", "Formato", "Estilo", "Info"] as const;
type Tab = (typeof TABS)[number];

const HIGHLIGHTS = [
  { label: "Amarelo", value: "#fde68a" },
  { label: "Verde", value: "#bbf7d0" },
  { label: "Azul", value: "#bae6fd" },
  { label: "Rosa", value: "#fbcfe8" },
  { label: "Laranja", value: "#fed7aa" },
  { label: "Roxo", value: "#ddd6fe" },
];

const TABLE_ROWS = 5;
const TABLE_COLS = 8;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function NoteEditorPanel({
  note,
  editor,
  onClose,
}: {
  note: Note;
  editor?: Editor | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Inserir");
  const [infoTab, setInfoTab] = useState<"info" | "acoes">("info");
  const [grid, setGrid] = useState<{ r: number; c: number } | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const onChange = (patch: Partial<Note>) => boardActions.updateNote(note.id, patch);

  // O painel lê `isActive` do editor, que muda com a seleção — e mudança de
  // seleção não re-renderiza este componente sozinha. Sem isto os botões de
  // Formato mostrariam o estado do cursor anterior.
  const [, bumpTick] = useState(0);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const bump = () => bumpTick((t) => t + 1);
    editor.on("transaction", bump);
    editor.on("selectionUpdate", bump);
    return () => {
      editor.off("transaction", bump);
      editor.off("selectionUpdate", bump);
    };
  }, [editor]);

  const run = (fn: (e: Editor) => void) => () => {
    if (editor && !editor.isDestroyed) fn(editor);
  };

  const pickMedia = (files: FileList | null) => {
    if (editor && !editor.isDestroyed) void insertMediaFiles(editor, files);
  };

  /** Linha do catálogo: ícone, rótulo e a alça de arraste à direita. */
  const row = (
    label: string,
    Icon: typeof Bold,
    onClick: () => void,
    dragKind?: string,
  ) => (
    <div
      key={label}
      draggable={!!editor && !!dragKind}
      onDragStart={(e) => {
        if (!dragKind) return;
        e.dataTransfer.setData(BLOCK_DRAG_MIME, dragKind);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-[13px] transition-colors",
        editor ? "cursor-grab hover:bg-accent active:cursor-grabbing" : "opacity-40",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
      <GripVertical className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
    </div>
  );

  const iconBtn = (
    label: string,
    Icon: typeof Bold,
    action: (e: Editor) => void,
    activeKey?: string,
  ) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      disabled={!editor}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run(action)}
      className={cn(
        "flex h-9 items-center justify-center rounded-lg border border-border text-foreground/70 transition-colors hover:bg-accent disabled:opacity-40",
        activeKey && editor?.isActive(activeKey) && "bg-accent text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const styleBtn = (label: string, action: (e: Editor) => void, active: boolean) => (
    <button
      key={label}
      type="button"
      disabled={!editor}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run(action)}
      className={cn(
        "rounded-lg border px-2 py-2 text-[13px] font-semibold transition-colors disabled:opacity-40",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-foreground/80 hover:bg-accent",
      )}
    >
      {label}
    </button>
  );

  const actionRow = (
    label: string,
    Icon: typeof Bold,
    onClick: () => void,
    danger = false,
  ) => (
    <button
      key={label}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors",
        danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", !danger && "text-muted-foreground")} />
      {label}
    </button>
  );

  const activeProject = useActiveProject();
  const activeFile = useActiveFile();
  const column = useFileColumns()?.find((c) => c.id === note.columnId);

  return (
    <section className="flex w-[22rem] shrink-0 flex-col border-l border-border bg-background">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-semibold">
          Nota
        </span>
        <button
          onClick={() => boardActions.setNoteArchived(note.id, !note.archived)}
          aria-label={note.archived ? "Restaurar nota" : "Arquivar nota"}
          className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
        >
          {note.archived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          {note.archived ? "Restaurar" : "Arquivar"}
        </button>
        <button onClick={onClose} aria-label="Fechar nota" className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>

      <nav className="flex items-center gap-3 border-b border-border px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "text-[13px] transition-colors",
              tab === t
                ? "font-semibold text-foreground"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="scroll-thin flex-1 overflow-y-auto px-3 py-3">
        {tab === "Inserir" && (
          <>
            <div className="space-y-1.5">
              {TEXT_BLOCKS.map(({ kind, label, icon }) =>
                row(label, icon, run((ed) => insertBlock(ed, kind)), kind),
              )}
              {row("Imagem", ImagePlus, () => imageRef.current?.click())}
              {row("GIF ou vídeo", Film, () => mediaRef.current?.click())}
              {row(
                "Mídia por link",
                Link2,
                run((ed) => {
                  const url = window.prompt("Cole o link do GIF ou vídeo (https://...)");
                  if (url?.trim()) insertMediaUrl(ed, url);
                }),
              )}
            </div>

            <Group title="Da nota">
              <button
                onClick={() => onChange({ showChecklist: !note.showChecklist })}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition-colors",
                  note.showChecklist
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent",
                )}
              >
                <ListChecks className="h-4 w-4 shrink-0 text-muted-foreground" />
                Checklist
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {note.showChecklist ? "visível" : "oculto"}
                </span>
              </button>
            </Group>

            <Group title="Inserir linha">
              <div
                draggable={!!editor}
                onDragStart={(e) => {
                  e.dataTransfer.setData(BLOCK_DRAG_MIME, "divider");
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={run((ed) => insertBlock(ed, "divider"))}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-3 transition-colors",
                  editor ? "cursor-grab hover:bg-accent active:cursor-grabbing" : "opacity-40",
                )}
              >
                <span className="h-px flex-1 bg-foreground/30" />
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              </div>
            </Group>

            <Group title="Inserir tabela">
              <p className="-mt-1 mb-2 text-[11px] text-muted-foreground">
                {grid
                  ? `${grid.r} linha(s) × ${grid.c} coluna(s)`
                  : "Insira uma tabela com o número destacado de linhas e colunas."}
              </p>
              <div
                className="grid grid-cols-8 gap-1"
                onMouseLeave={() => setGrid(null)}
                onDragStart={(e) => {
                  e.dataTransfer.setData(BLOCK_DRAG_MIME, "table");
                  e.dataTransfer.effectAllowed = "copy";
                }}
                draggable={!!editor}
              >
                {Array.from({ length: TABLE_ROWS * TABLE_COLS }, (_, i) => {
                  const r = Math.floor(i / TABLE_COLS) + 1;
                  const c = (i % TABLE_COLS) + 1;
                  const on = !!grid && r <= grid.r && c <= grid.c;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Tabela ${r} por ${c}`}
                      disabled={!editor}
                      onMouseEnter={() => setGrid({ r, c })}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={run((ed) => insertTable(ed, r, c))}
                      className={cn(
                        "h-6 rounded-md border transition-colors disabled:opacity-40",
                        on ? "border-primary bg-primary/60" : "border-border bg-muted",
                      )}
                    />
                  );
                })}
              </div>
            </Group>

            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                pickMedia(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={mediaRef}
              type="file"
              accept="video/*,image/gif"
              multiple
              hidden
              onChange={(e) => {
                pickMedia(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        )}

        {tab === "Formato" && (
          <>
            {!editor && (
              <p className="mb-2 text-[11px] text-muted-foreground">
                Clique no texto da nota para habilitar a formatação.
              </p>
            )}

            <Group title="Texto">
              <div className="grid grid-cols-3 gap-1.5">
                {styleBtn(
                  "Título",
                  (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
                  editor?.isActive("heading", { level: 1 }) ?? false,
                )}
                {styleBtn(
                  "Subtítulo",
                  (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
                  editor?.isActive("heading", { level: 2 }) ?? false,
                )}
                {styleBtn(
                  "Seção",
                  (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
                  editor?.isActive("heading", { level: 3 }) ?? false,
                )}
                {styleBtn(
                  "Forte",
                  (e) => e.chain().focus().toggleHeading({ level: 4 }).run(),
                  editor?.isActive("heading", { level: 4 }) ?? false,
                )}
                {styleBtn(
                  "Corpo",
                  (e) => e.chain().focus().setParagraph().run(),
                  editor?.isActive("paragraph") ?? false,
                )}
                {styleBtn(
                  "Legenda",
                  (e) => e.chain().focus().toggleHeading({ level: 5 }).run(),
                  editor?.isActive("heading", { level: 5 }) ?? false,
                )}
              </div>
            </Group>

            <Group title="Marcações">
              <div className="grid grid-cols-4 gap-1.5">
                {iconBtn("Negrito", Bold, (e) => e.chain().focus().toggleBold().run(), "bold")}
                {iconBtn("Itálico", Italic, (e) => e.chain().focus().toggleItalic().run(), "italic")}
                {iconBtn(
                  "Sublinhado",
                  UnderlineIcon,
                  (e) => e.chain().focus().toggleUnderline().run(),
                  "underline",
                )}
                {iconBtn(
                  "Tachado",
                  Strikethrough,
                  (e) => e.chain().focus().toggleStrike().run(),
                  "strike",
                )}
                {iconBtn("Código", Code, (e) => e.chain().focus().toggleCode().run(), "code")}
                {iconBtn(
                  "Hiperlink",
                  Link2,
                  (e) => {
                    if (e.isActive("link")) {
                      e.chain().focus().unsetLink().run();
                      return;
                    }
                    const url = window.prompt("Cole o endereço do link (https://...)");
                    if (url?.trim())
                      e.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
                  },
                  "link",
                )}
                {iconBtn("Limpar formatação", RemoveFormatting, (e) =>
                  e.chain().focus().unsetAllMarks().clearNodes().run(),
                )}
              </div>
            </Group>

            <Group title="Listas e blocos">
              <div className="grid grid-cols-4 gap-1.5">
                {iconBtn(
                  "Lista",
                  List,
                  (e) => e.chain().focus().toggleBulletList().run(),
                  "bulletList",
                )}
                {iconBtn(
                  "Lista numerada",
                  ListOrdered,
                  (e) => e.chain().focus().toggleOrderedList().run(),
                  "orderedList",
                )}
                {iconBtn(
                  "Citação",
                  Quote,
                  (e) => e.chain().focus().toggleBlockquote().run(),
                  "blockquote",
                )}
                {iconBtn(
                  "Bloco de código",
                  Code,
                  (e) => e.chain().focus().toggleCodeBlock().run(),
                  "codeBlock",
                )}
              </div>
            </Group>

            <Group title="Cor de realce">
              <div className="flex flex-wrap items-center gap-2">
                {HIGHLIGHTS.map((h) => (
                  <button
                    key={h.value}
                    title={h.label}
                    aria-label={`Realce ${h.label}`}
                    disabled={!editor}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={run((e) => e.chain().focus().setHighlight({ color: h.value }).run())}
                    className="h-7 w-7 rounded-full border border-border disabled:opacity-40"
                    style={{ backgroundColor: h.value }}
                  />
                ))}
                <button
                  disabled={!editor}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={run((e) => e.chain().focus().unsetHighlight().run())}
                  className="h-7 rounded-full border border-border px-2.5 text-[11px] text-muted-foreground hover:bg-accent disabled:opacity-40"
                >
                  Limpar
                </button>
              </div>
            </Group>
          </>
        )}

        {tab === "Estilo" && (
          <>
            <Group title="Cor da nota">
              <div className="flex flex-wrap gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    aria-label={noteLabel[c]}
                    title={noteLabel[c]}
                    onClick={() => onChange({ color: c, colorHex: null })}
                    className={cn(
                      "h-7 w-7 rounded-full border border-border",
                      noteBg[c],
                      note.color === c &&
                        !note.colorHex &&
                        "ring-2 ring-ring ring-offset-2 ring-offset-background",
                    )}
                  />
                ))}
              </div>
            </Group>

            <Group title="Cor personalizada">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Cor personalizada da nota"
                  value={note.colorHex ?? "#f4c7d6"}
                  onChange={(e) => onChange({ colorHex: e.target.value })}
                  className="h-9 w-16 cursor-pointer rounded-lg border border-border bg-transparent"
                />
                <span className="text-xs text-muted-foreground">
                  {note.colorHex ?? "usando a paleta"}
                </span>
                {note.colorHex && (
                  <button
                    onClick={() => onChange({ colorHex: null })}
                    className="ml-auto rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
                  >
                    Remover
                  </button>
                )}
              </div>
            </Group>

            <Group title="Altura no quadro">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {note.height ? `${note.height}px fixos` : "ajusta ao conteúdo"}
                </span>
                {note.height && (
                  <button
                    onClick={() => onChange({ height: null })}
                    className="ml-auto rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
                  >
                    Redefinir
                  </button>
                )}
              </div>
            </Group>
          </>
        )}

        {tab === "Info" && (
          <>
            <div className="flex rounded-lg bg-muted p-0.5">
              {(
                [
                  ["info", "Informações"],
                  ["acoes", "Ações"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setInfoTab(id)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                    infoTab === id
                      ? "bg-background font-semibold text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {infoTab === "info" ? (
              <>
                <Group title="Propriedades">
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Atualizado</dt>
                      <dd>{timeAgo(note.updatedAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Autor</dt>
                      <dd>{note.author}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Tipo</dt>
                      <dd>Nota autoadesiva</dd>
                    </div>
                  </dl>
                </Group>

                <Group title="Responsáveis">
                  <AssigneeSelect
                    value={noteAssignees(note)}
                    onChange={(names) => onChange({ assignees: names, assignee: names[0] ?? null })}
                    size="md"
                    variant="cta"
                  />
                </Group>

                <Group title="Etiquetas">
                  <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} size="md" />
                </Group>

                <Group title="Status">
                  <StatusSelect value={note.status} onChange={(status) => onChange({ status })} />
                </Group>

                <Group title="Categoria">
                  <CategorySelect
                    value={note.category}
                    onChange={(category) => onChange({ category })}
                  />
                </Group>

                <Group title="Prioridade">
                  <div className="flex flex-wrap gap-1.5">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => onChange({ priority: note.priority === p ? null : p })}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs",
                          note.priority === p
                            ? priorityClass[p]
                            : "border-border bg-background text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
                      </button>
                    ))}
                  </div>
                </Group>

                <Group title="Prazo de conclusão">
                  <DeadlinePicker
                    value={note.deadline}
                    onChange={(deadline) => onChange({ deadline })}
                  />
                </Group>

                <Group title="Localização">
                  <p className="text-xs text-muted-foreground">
                    {[activeProject?.name, activeFile?.name, column?.title]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Group>
              </>
            ) : (
              <Group title="Ações">
                <div className="space-y-0.5">
                  {actionRow(
                    note.pinned ? "Desafixar do topo" : "Fixar no topo",
                    note.pinned ? PinOff : Pin,
                    () => boardActions.setNotePinned(note.id, !note.pinned),
                  )}
                  {actionRow("Duplicar", Copy, () => boardActions.duplicateNote(note.id))}
                  {actionRow(
                    note.archived ? "Restaurar" : "Arquivar",
                    note.archived ? ArchiveRestore : Archive,
                    () => boardActions.setNoteArchived(note.id, !note.archived),
                  )}
                  {actionRow(
                    "Excluir",
                    Trash2,
                    () => {
                      boardActions.removeNote(note.id);
                      onClose();
                    },
                    true,
                  )}
                </div>
              </Group>
            )}
          </>
        )}
      </div>
    </section>
  );
}
