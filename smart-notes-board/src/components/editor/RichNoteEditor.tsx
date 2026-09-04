import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { BlockHandle } from "@/components/editor/BlockHandle";
import { EditorBoundary } from "@/components/editor/EditorBoundary";
import { ImageLightbox } from "@/components/note/ImageLightbox";
import { ImageToolbar } from "@/components/editor/ImageToolbar";
import { TableMenu } from "@/components/editor/TableMenu";
import {
  BLOCK_DRAG_MIME,
  insertBlock,
  readAsDataUrl,
  type BlockKind,
} from "@/components/editor/editor-blocks";
import { DraggableImage, Video, collectImages } from "@/components/editor/editor-extensions";
import { cn } from "@/lib/utils";
import { NoteRichContent } from "@/components/note/NoteRichContent";

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
  const proseRef = useRef<HTMLDivElement>(null);

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

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div
        ref={proseRef}
        className={cn(
          "note-prose scroll-thin relative py-1.5",
          compact ? "text-xs" : "text-sm",
          maxHeight && `${maxHeight} overflow-y-auto`,
        )}
        onClick={() => {
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

        {/* Um clique na imagem seleciona o nó (para arrastar ou apagar pelo
            teclado); ampliar é o duplo clique ou o botão da barra. */}
        {mounted && <ImageToolbar editor={editor} containerRef={proseRef} onZoom={setLightbox} />}
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
