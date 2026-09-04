import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import { Maximize2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BlockHandle } from "./BlockHandle";
import { EditorBoundary } from "./EditorBoundary";
import { ImageLightbox } from "./ImageLightbox";
import { TableMenu } from "./TableMenu";
import { BLOCK_DRAG_MIME, insertBlock, readAsDataUrl, type BlockKind } from "./editor-blocks";
import { DraggableImage, Video, collectImages } from "./editor-extensions";
import { cn } from "@/lib/utils";
import { NoteRichContent } from "./NoteRichContent";

/**
 * Superfície de edição da nota. Formatação e inserção de blocos vivem no painel
 * lateral (`NoteEditorPanel`), que age sobre a instância exposta por `onEditor`;
 * aqui ficam só o documento, as ferramentas de imagem e os controles de bloco.
 */
type NoteEditorProps = {
  content: string;
  onChange: (html: string) => void;
  minHeight?: string;
  maxHeight?: string;
  compact?: boolean;
  /** Margem com alça de bloco (arrastar para reordenar) e drop vindo do painel. */
  blocks?: boolean;
  /** Expõe a instância do editor para o painel lateral agir sobre ela. */
  onEditor?: (editor: Editor | null) => void;
};

function RichNoteEditorBase({
  content,
  onChange,
  minHeight = "min-h-16",
  maxHeight,
  compact = false,
  blocks = false,
  onEditor,
}: NoteEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{ src: string; top: number; left: number } | null>(null);
  const proseRef = useRef<HTMLDivElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  // Em cards compactos o editor só é montado ao interagir: evita dezenas de
  // instâncias do Tiptap montando ao mesmo tempo (loop de forceUpdate).
  const [mounted, setMounted] = useState(!compact);

  const images = useMemo(() => collectImages(content), [content]);
  const lightboxIndex = lightbox ? images.indexOf(lightbox) : -1;

  const editor = useEditor({
    extensions: [
      // Link e Underline já vêm no StarterKit v3: registrá-los de novo duplica
      // a marca no schema e faz esta configuração ser descartada.
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noreferrer noopener", target: "_blank" },
        },
      }),
      Highlight.configure({ multicolor: true }),
      DraggableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "note-img" },
      }),
      Video,
      TableKit.configure({ table: { resizable: true, HTMLAttributes: { class: "note-table" } } }),
    ],

    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // Calha à esquerda para a alça de bloco não cobrir o texto.
        class: cn("outline-none", minHeight, compact ? "text-xs" : "text-sm", blocks && "pl-11"),
      },
      handleDrop: (view, event) => {
        // Bloco arrastado do painel: entra na posição solta, não como texto.
        const kind = event.dataTransfer?.getData(BLOCK_DRAG_MIME) as BlockKind | "";
        if (kind) {
          event.preventDefault();
          const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
          const ed = editorRef.current;
          if (ed) insertBlock(ed, kind, at?.pos);
          return true;
        }
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        void Promise.all(files.map(readAsDataUrl)).then((urls) => {
          urls.forEach((src) => {
            const ed = editorRef.current;
            if (!ed || ed.isDestroyed) return;
            ed.chain().focus().setImage({ src }).run();
          });
        });
        return true;
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.items ?? [])
          .find((i) => i.type.startsWith("image/"))
          ?.getAsFile();
        if (!file) return false;
        event.preventDefault();
        void readAsDataUrl(file).then((src) => {
          const ed = editorRef.current;
          if (!ed || ed.isDestroyed) return;
          ed.chain().focus().setImage({ src }).run();
        });
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      if (editor.isDestroyed) return;
      onChangeRef.current(editor.getHTML());
    },
  });

  const editorRef = useRef(editor);
  editorRef.current = editor;

  const onEditorRef = useRef(onEditor);
  onEditorRef.current = onEditor;
  useEffect(() => {
    onEditorRef.current?.(editor);
    return () => onEditorRef.current?.(null);
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (!editor.isFocused && editor.getHTML() !== content) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  const showImageTools = (img: HTMLImageElement) => {
    const box = proseRef.current?.getBoundingClientRect();
    if (!box) return;
    const r = img.getBoundingClientRect();
    setHovered({ src: img.src, top: r.top - box.top, left: r.left - box.left });
  };

  const withImageNode = (src: string, fn: (pos: number, size: number) => void) => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed) return;
    let foundPos = -1;
    let foundSize = 0;
    ed.state.doc.descendants((node, pos) => {
      if (foundPos === -1 && node.type.name === "image" && node.attrs["src"] === src) {
        foundPos = pos;
        foundSize = node.nodeSize;
        return false;
      }
      return true;
    });
    if (foundPos >= 0) fn(foundPos, foundSize);
  };

  const deleteImage = (src: string) => {
    setHovered(null);
    withImageNode(src, (pos, size) => {
      editorRef.current
        ?.chain()
        .deleteRange({ from: pos, to: pos + size })
        .run();
    });
  };

  const replaceImage = async (file: File) => {
    const target = replaceTargetRef.current;
    if (!target) return;
    const url = await readAsDataUrl(file);
    setHovered(null);
    withImageNode(target, (pos, size) => {
      editorRef.current
        ?.chain()
        .insertContentAt({ from: pos, to: pos + size }, { type: "image", attrs: { src: url } })
        .run();
    });
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div
        ref={proseRef}
        className={cn(
          "note-prose scroll-thin relative py-1.5",
          compact ? "text-xs" : "text-sm",
          maxHeight && `${maxHeight} overflow-y-auto`,
        )}
        onMouseMove={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") showImageTools(target as HTMLImageElement);
          else if (!(e.target as HTMLElement).closest("[data-img-tools]")) setHovered(null);
        }}
        onMouseLeave={() => setHovered(null)}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          // Um clique na imagem apenas revela as ferramentas e deixa o editor
          // selecionar o nó — antes ele abria o visualizador e devolvia, o que
          // tornava impossível posicionar o cursor ou arrastar a imagem. Como
          // toque não tem `hover`, é também aqui que as ferramentas aparecem
          // no celular.
          if (target.tagName === "IMG" && mounted) {
            showImageTools(target as HTMLImageElement);
          }
          if (!mounted) setMounted(true);
        }}
        onDoubleClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") setLightbox((target as HTMLImageElement).src);
        }}
      >
        {mounted ? (
          <EditorContent editor={editor} />
        ) : (
          <NoteRichContent
            html={content}
            fallback="<p></p>"
            className={cn("cursor-text", minHeight)}
          />
        )}

        {mounted && <TableMenu editor={editor} containerRef={proseRef} />}
        {mounted && blocks && <BlockHandle editor={editor} containerRef={proseRef} />}

        {hovered && (
          <div
            data-img-tools
            className="absolute z-20 flex items-center gap-1 rounded-md border border-border bg-popover/95 p-1 shadow-md backdrop-blur"
            style={{ top: hovered.top + 6, left: hovered.left + 6 }}
          >
            <button
              type="button"
              aria-label="Ampliar imagem"
              title="Ampliar"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(hovered.src);
              }}
              className="rounded p-1 text-foreground/70 hover:bg-foreground/10"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Substituir imagem"
              title="Substituir imagem"
              onClick={(e) => {
                e.stopPropagation();
                replaceTargetRef.current = hovered.src;
                replaceRef.current?.click();
              }}
              className="rounded p-1 text-foreground/70 hover:bg-foreground/10"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Excluir imagem"
              title="Excluir imagem"
              onClick={(e) => {
                e.stopPropagation();
                deleteImage(hovered.src);
              }}
              className="rounded p-1 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          ref={replaceRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void replaceImage(file);
          }}
        />
      </div>

      {lightbox && lightboxIndex >= 0 && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onIndexChange={(i) => setLightbox(images[i] ?? null)}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

/** Uma falha do editor fica contida na nota, sem levar o quadro junto. */
export function RichNoteEditor(props: NoteEditorProps) {
  return (
    <EditorBoundary>
      <RichNoteEditorBase {...props} />
    </EditorBoundary>
  );
}
