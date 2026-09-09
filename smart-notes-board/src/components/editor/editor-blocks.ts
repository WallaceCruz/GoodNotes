import type { Editor } from "@tiptap/react";
import {
  Code2,
  Film,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  ImagePlus,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  Type,
} from "lucide-react";

/** Tipo MIME do arraste painel → documento (Craft: "arraste e solte no documento"). */
export const BLOCK_DRAG_MIME = "application/x-sticky-block";

export type BlockKind =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock"
  | "divider"
  | "table";

/**
 * Catálogo de blocos do painel. Os mesmos blocos também nascem dos atalhos que o
 * editor já reconhece ao digitar (`# `, `- `, `> `, ```` ``` ````, via StarterKit).
 */
export type BlockEntry = { kind: BlockKind; label: string; icon: typeof Type };

export const INSERT_BLOCKS: BlockEntry[] = [
  { kind: "paragraph", label: "Texto", icon: Type },
  { kind: "h1", label: "Título 1", icon: Heading1 },
  { kind: "h2", label: "Título 2", icon: Heading2 },
  { kind: "h3", label: "Título 3", icon: Heading3 },
  { kind: "h4", label: "Título 4", icon: Heading4 },
  { kind: "h5", label: "Título 5", icon: Heading5 },
  { kind: "h6", label: "Título 6", icon: Heading6 },
  { kind: "bulletList", label: "Lista", icon: List },
  { kind: "orderedList", label: "Lista numerada", icon: ListOrdered },
  { kind: "taskList", label: "Checklist", icon: ListChecks },
  { kind: "blockquote", label: "Citação", icon: Quote },
  { kind: "codeBlock", label: "Bloco de código", icon: Code2 },
  { kind: "divider", label: "Divisor", icon: Minus },
  { kind: "table", label: "Tabela", icon: TableIcon },
];

/** Blocos de texto puro — a seção "Blocos" do painel. Tabela e linha têm UI própria. */
export const TEXT_BLOCKS = INSERT_BLOCKS.filter((b) => b.kind !== "table" && b.kind !== "divider");

/**
 * O que a mídia precisa e um bloco de texto não: um seletor de arquivo ou um
 * endereço. Ficam à parte porque não são inseríveis só com `insertBlock`.
 */
export type MediaKind = "image" | "video" | "mediaUrl" | "link";

export const MEDIA_ACTIONS: Array<{ kind: MediaKind; label: string; icon: typeof Type }> = [
  { kind: "image", label: "Imagem", icon: ImagePlus },
  { kind: "video", label: "GIF ou vídeo", icon: Film },
  { kind: "mediaUrl", label: "Mídia por link", icon: Link2 },
  { kind: "link", label: "Hiperlink", icon: Link2 },
];

/**
 * As seções do menu do botão "+", na ordem em que aparecem.
 *
 * A mesma lista serve o menu da alça e o painel lateral: um bloco novo entra
 * aqui uma vez e aparece nos dois lugares.
 */
export const BLOCK_MENU_GROUPS: Array<{ title: string; kinds: BlockKind[] }> = [
  { title: "Transformar em", kinds: ["paragraph", "h1", "h2", "h3", "h4", "h5", "h6"] },
  { title: "Listas", kinds: ["bulletList", "orderedList", "taskList"] },
  { title: "Blocos", kinds: ["blockquote", "codeBlock"] },
  { title: "Inserir", kinds: ["divider", "table"] },
];

/**
 * Blocos que *substituem* o bloco atual, como no Notion e no Obsidian:
 * escolher "Título 1" com o cursor num parágrafo transforma aquele parágrafo,
 * preservando o texto. Divisor e tabela não têm o que transformar — nascem
 * abaixo — e por isso ficam na seção "Inserir".
 */
const CONVERSIVEIS = new Set<BlockKind>([
  "paragraph",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "codeBlock",
]);

export const isConvertible = (kind: BlockKind): boolean => CONVERSIVEIS.has(kind);

const HEADING_LEVEL: Partial<Record<BlockKind, 1 | 2 | 3 | 4 | 5 | 6>> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

/** O tipo do bloco que está na posição — para o menu marcar o atual. */
export function blockKindAt(editor: Editor, pos: number): BlockKind | null {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return null;
  switch (node.type.name) {
    case "paragraph":
      return "paragraph";
    case "heading": {
      const level = Number(node.attrs["level"]);
      return level >= 1 && level <= 6 ? (`h${level}` as BlockKind) : null;
    }
    case "bulletList":
      return "bulletList";
    case "orderedList":
      return "orderedList";
    case "taskList":
      return "taskList";
    case "blockquote":
      return "blockquote";
    case "codeBlock":
      return "codeBlock";
    case "horizontalRule":
      return "divider";
    case "table":
      return "table";
    default:
      return null;
  }
}

/**
 * Transforma o bloco na posição dada, ou insere abaixo dele o que não se
 * transforma. `pos` é a posição *do* bloco, não a de depois dele.
 */
export function applyBlock(editor: Editor, kind: BlockKind, pos: number): void {
  if (editor.isDestroyed) return;

  if (!isConvertible(kind)) {
    const node = editor.state.doc.nodeAt(pos);
    insertBlock(editor, kind, pos + (node?.nodeSize ?? 0));
    return;
  }

  // Já é esse tipo: os comandos `toggle*` desfariam a formatação, e ninguém
  // escolhe "Lista" numa lista esperando que ela deixe de ser lista.
  if (blockKindAt(editor, pos) === kind) return;

  // O cursor pode estar em outro bloco: a alça segue o ponteiro, não a seleção.
  const chain = editor
    .chain()
    .focus()
    .setTextSelection(pos + 1);
  const level = HEADING_LEVEL[kind];

  if (level) chain.setHeading({ level });
  else if (kind === "paragraph") chain.setParagraph();
  else if (kind === "bulletList") chain.toggleBulletList();
  else if (kind === "orderedList") chain.toggleOrderedList();
  else if (kind === "taskList") chain.toggleTaskList();
  else if (kind === "blockquote") chain.toggleBlockquote();
  else if (kind === "codeBlock") chain.toggleCodeBlock();

  chain.run();
}

export const blockEntry = (kind: BlockKind): BlockEntry =>
  INSERT_BLOCKS.find((b) => b.kind === kind) ?? INSERT_BLOCKS[0]!;

export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

const VIDEO_URL = /\.(mp4|webm|ogg|mov)(\?|$)/i;

/** Insere mídia por endereço, escolhendo vídeo ou imagem pela extensão. */
export function insertMediaUrl(editor: Editor, url: string) {
  const clean = url.trim();
  if (!clean || editor.isDestroyed) return;
  if (VIDEO_URL.test(clean) || clean.startsWith("data:video"))
    editor
      .chain()
      .focus()
      .insertContent({ type: "video", attrs: { src: clean } })
      .run();
  else editor.chain().focus().setImage({ src: clean }).run();
}

/**
 * Insere arquivos de mídia como data URL. O quadro inteiro é serializado no
 * armazenamento local, então arquivos grandes são recusados aqui — depois de
 * embutidos não haveria como salvar o quadro.
 */
export async function insertMediaFiles(editor: Editor, files: FileList | null) {
  if (!files) return;
  for (const file of Array.from(files)) {
    if (file.size > MAX_MEDIA_BYTES) {
      window.alert("Arquivos acima de 8 MB não podem ser salvos na nota.");
      continue;
    }
    const src = await readAsDataUrl(file);
    if (editor.isDestroyed) return;
    insertMediaUrl(editor, src);
  }
}

const emptyParagraph = { type: "paragraph" };
const listWithItem = (type: string) => ({
  type,
  content: [{ type: "listItem", content: [emptyParagraph] }],
});

const heading = (level: number) => ({ type: "heading", attrs: { level } });

const BLOCK_JSON: Record<Exclude<BlockKind, "table">, Record<string, unknown>> = {
  paragraph: emptyParagraph,
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  h5: heading(5),
  h6: heading(6),
  bulletList: listWithItem("bulletList"),
  orderedList: listWithItem("orderedList"),
  // O item de tarefa nasce desmarcado; `checked` é obrigatório no schema.
  taskList: {
    type: "taskList",
    content: [{ type: "taskItem", attrs: { checked: false }, content: [emptyParagraph] }],
  },
  blockquote: { type: "blockquote", content: [emptyParagraph] },
  codeBlock: { type: "codeBlock" },
  divider: { type: "horizontalRule" },
};

/**
 * Fronteira do bloco de nível 1 que contém a posição — o bloco novo entra
 * *depois* do bloco inteiro, nunca partindo um parágrafo ou uma lista ao meio.
 */
function blockBoundary(editor: Editor, at?: number): number {
  const $pos =
    at === undefined
      ? editor.state.selection.$from
      : editor.state.doc.resolve(Math.min(Math.max(at, 0), editor.state.doc.content.size));
  return $pos.depth > 0 ? $pos.after(1) : $pos.pos;
}

/** Insere uma tabela do tamanho escolhido (no cursor, ou na posição `at` do drop). */
export function insertTable(editor: Editor, rows: number, cols: number, at?: number) {
  if (editor.isDestroyed) return;
  editor
    .chain()
    .focus()
    .setTextSelection(blockBoundary(editor, at))
    .insertTable({ rows, cols, withHeaderRow: true })
    .run();
}

/** Insere um bloco vazio do tipo pedido (no cursor, ou na posição `at` do drop). */
export function insertBlock(editor: Editor, kind: BlockKind, at?: number) {
  if (editor.isDestroyed) return;
  if (kind === "table") {
    insertTable(editor, 3, 3, at);
    return;
  }
  editor.chain().focus().insertContentAt(blockBoundary(editor, at), BLOCK_JSON[kind]).run();
}
