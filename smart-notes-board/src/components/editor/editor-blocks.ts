import type { Editor } from "@tiptap/react";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
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
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "codeBlock"
  | "divider"
  | "table";

/**
 * Catálogo de blocos do painel. Os mesmos blocos também nascem dos atalhos que o
 * editor já reconhece ao digitar (`# `, `- `, `> `, ```` ``` ````, via StarterKit).
 */
export const INSERT_BLOCKS: Array<{
  kind: BlockKind;
  label: string;
  icon: typeof Type;
}> = [
  { kind: "paragraph", label: "Texto", icon: Type },
  { kind: "h1", label: "Título", icon: Heading1 },
  { kind: "h2", label: "Subtítulo", icon: Heading2 },
  { kind: "h3", label: "Título menor", icon: Heading3 },
  { kind: "bulletList", label: "Lista", icon: List },
  { kind: "orderedList", label: "Lista numerada", icon: ListOrdered },
  { kind: "blockquote", label: "Citação", icon: Quote },
  { kind: "codeBlock", label: "Bloco de código", icon: Code2 },
  { kind: "divider", label: "Divisor", icon: Minus },
  { kind: "table", label: "Tabela", icon: TableIcon },
];

/** Blocos de texto puro — a seção "Blocos" do painel. Tabela e linha têm UI própria. */
export const TEXT_BLOCKS = INSERT_BLOCKS.filter((b) => b.kind !== "table" && b.kind !== "divider");

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

const BLOCK_JSON: Record<Exclude<BlockKind, "table">, Record<string, unknown>> = {
  paragraph: emptyParagraph,
  h1: { type: "heading", attrs: { level: 1 } },
  h2: { type: "heading", attrs: { level: 2 } },
  h3: { type: "heading", attrs: { level: 3 } },
  bulletList: listWithItem("bulletList"),
  orderedList: listWithItem("orderedList"),
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
