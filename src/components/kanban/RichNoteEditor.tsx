import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Lightbox = { src: string; title: string } | null;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function RichNoteEditor({
  content,
  onChange,
  minHeight = "min-h-16",
  compact = false,
}: {
  content: string;
  onChange: (html: string) => void;
  minHeight?: string;
  compact?: boolean;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [lightbox, setLightbox] = useState<Lightbox>(null);
  const [linkDraft, setLinkDraft] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: "note-img" } }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("outline-none", minHeight, compact ? "text-xs" : "text-sm"),
      },
      handleDrop: (view, event) => {
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

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (!editor.isFocused && editor.getHTML() !== content) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  const openImage = (src: string) => {
    if (!editor || editor.isDestroyed) return;
    let title = "";
    editor.state.doc.descendants((node) => {
      if (node.type.name === "image" && node.attrs['src'] === src) title = (node.attrs['title'] as string) ?? "";
    });
    setLinkDraft(title || "");
    setLightbox({ src, title: title || "" });
  };

  const saveLink = () => {
    if (!editor || editor.isDestroyed || !lightbox) return;
    const { state, view } = editor;
    const tr = state.tr;
    state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && node.attrs['src'] === lightbox.src) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, title: linkDraft });
      }
    });
    view.dispatch(tr);
    onChangeRef.current(editor.getHTML());
    setLightbox(null);
  };

  const addImageByUrl = () => {
    const url = window.prompt("Cole a URL da imagem");
    if (url?.trim() && editor && !editor.isDestroyed)
      editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const btn = (
    key: string | null,
    action: () => void,
    Icon: typeof Bold,
    label: string,
    disabled = false,
  ) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        action();
      }}
      className={cn(
        "rounded p-1 text-foreground/60 hover:bg-foreground/10 disabled:opacity-30",
        key && editor?.isActive(key) && "bg-foreground/10 text-foreground",
      )}
    >
      <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} />
    </button>
  );

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-0.5 border-y border-foreground/10 py-0.5">
        {btn("bold", () => editor?.chain().focus().toggleBold().run(), Bold, "Negrito")}
        {btn("italic", () => editor?.chain().focus().toggleItalic().run(), Italic, "Itálico")}
        {btn(
          "underline",
          () => editor?.chain().focus().toggleUnderline().run(),
          UnderlineIcon,
          "Sublinhado",
        )}
        {btn("strike", () => editor?.chain().focus().toggleStrike().run(), Strikethrough, "Tachado")}
        {btn(
          "heading",
          () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
          Heading1,
          "Título 1",
        )}
        {btn(
          "heading",
          () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          Heading2,
          "Título 2",
        )}
        {btn("bulletList", () => editor?.chain().focus().toggleBulletList().run(), List, "Lista")}
        {btn(
          "orderedList",
          () => editor?.chain().focus().toggleOrderedList().run(),
          ListOrdered,
          "Lista numerada",
        )}
        {btn(null, addImageByUrl, ImagePlus, "Inserir imagem por URL")}
        <span className="mx-0.5 h-3 w-px bg-foreground/15" />
        {btn(
          null,
          () => editor?.chain().focus().undo().run(),
          Undo2,
          "Desfazer",
          !editor?.can().undo(),
        )}
        {btn(
          null,
          () => editor?.chain().focus().redo().run(),
          Redo2,
          "Refazer",
          !editor?.can().redo(),
        )}
      </div>
      <div
        className="note-prose py-1.5"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") openImage((target as HTMLImageElement).src);
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Imagem da nota</DialogTitle>
          </DialogHeader>
          {lightbox && (
            <div className="space-y-3">
              <img
                src={lightbox.src}
                alt="Imagem ampliada da nota"
                className="max-h-[60vh] w-full rounded-md object-contain"
              />
              <div className="flex items-center gap-2">
                <input
                  value={linkDraft}
                  onChange={(e) => setLinkDraft(e.target.value)}
                  placeholder="https://link-da-imagem"
                  aria-label="Link da imagem"
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none"
                />
                <button
                  onClick={saveLink}
                  className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
                >
                  Salvar link
                </button>
                {linkDraft && (
                  <a
                    href={linkDraft}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
                  >
                    Abrir
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
