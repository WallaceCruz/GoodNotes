import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { label: "Amarelo", value: "#fde68a" },
  { label: "Verde", value: "#bbf7d0" },
  { label: "Azul", value: "#bae6fd" },
  { label: "Rosa", value: "#fbcfe8" },
  { label: "Laranja", value: "#fed7aa" },
];

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
  showToolbar = true,
  onToggleChecklist,
  checklistActive = false,
}: {
  content: string;
  onChange: (html: string) => void;
  minHeight?: string;
  compact?: boolean;
  showToolbar?: boolean;
  onToggleChecklist?: () => void;
  checklistActive?: boolean;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [swatchOpen, setSwatchOpen] = useState(false);
  // Em cards compactos o editor só é montado ao interagir: evita dezenas de
  // instâncias do Tiptap montando ao mesmo tempo (loop de forceUpdate).
  const [mounted, setMounted] = useState(!compact);
  const fileRef = useRef<HTMLInputElement>(null);


  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noreferrer noopener", target: "_blank" } }),
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: "note-img" } }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("outline-none", minHeight, compact ? "text-xs" : "text-sm"),
      },
      handleDrop: (_view, event) => {
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

  const insertFiles = (files: FileList | null) => {
    if (!files) return;
    void Promise.all(Array.from(files).filter((f) => f.type.startsWith("image/")).map(readAsDataUrl)).then(
      (urls) =>
        urls.forEach((src) => {
          const ed = editorRef.current;
          if (!ed || ed.isDestroyed) return;
          ed.chain().focus().setImage({ src }).run();
        }),
    );
  };

  const applyLink = () => {
    if (!editor || editor.isDestroyed) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Cole o endereço do link (https://...)");
    if (!url?.trim()) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const btn = (
    key: string | null,
    action: () => void,
    Icon: typeof Bold,
    label: string,
    disabled = false,
    forceActive = false,
  ) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!mounted) setMounted(true);
        action();
      }}
      className={cn(
        "rounded p-1 text-foreground/60 hover:bg-foreground/10 disabled:opacity-30",
        ((key && editor?.isActive(key)) || forceActive) && "bg-foreground/10 text-foreground",
      )}
    >
      <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} />
    </button>
  );

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {showToolbar && (
      <div className="relative flex flex-wrap items-center gap-0.5 border-y border-foreground/10 py-0.5">
        {btn("bold", () => editor?.chain().focus().toggleBold().run(), Bold, "Negrito")}
        {btn("italic", () => editor?.chain().focus().toggleItalic().run(), Italic, "Itálico")}
        {btn(
          "underline",
          () => editor?.chain().focus().toggleUnderline().run(),
          UnderlineIcon,
          "Sublinhado",
        )}
        {btn("strike", () => editor?.chain().focus().toggleStrike().run(), Strikethrough, "Tachado")}
        {([
          [1, Heading1],
          [2, Heading2],
          [3, Heading3],
          [4, Heading4],
          [5, Heading5],
        ] as const).map(([level, Icon]) =>
          btn(
            null,
            () => editor?.chain().focus().toggleHeading({ level }).run(),
            Icon,
            `Título ${level}`,
            false,
            editor?.isActive("heading", { level }) ?? false,
          ),
        )}
        {btn("bulletList", () => editor?.chain().focus().toggleBulletList().run(), List, "Lista")}
        {btn(
          "orderedList",
          () => editor?.chain().focus().toggleOrderedList().run(),
          ListOrdered,
          "Lista numerada",
        )}
        {onToggleChecklist &&
          btn(null, onToggleChecklist, ListChecks, "Checklist", false, checklistActive)}
        {btn(null, () => fileRef.current?.click(), ImagePlus, "Adicionar imagem")}
        {btn(null, () => setSwatchOpen((v) => !v), Highlighter, "Cor de realce", false, editor?.isActive("highlight") ?? false)}
        {btn("link", applyLink, Link2, "Inserir hiperlink")}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            insertFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {swatchOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 flex items-center gap-1 rounded-md border border-border bg-popover p-1.5 shadow-md">
            {HIGHLIGHTS.map((h) => (
              <button
                key={h.value}
                aria-label={`Realce ${h.label}`}
                title={h.label}
                onClick={() => {
                  editor?.chain().focus().setHighlight({ color: h.value }).run();
                  setSwatchOpen(false);
                }}
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: h.value }}
              />
            ))}
            <button
              onClick={() => {
                editor?.chain().focus().unsetHighlight().run();
                setSwatchOpen(false);
              }}
              className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
            >
              Limpar
            </button>
          </div>
        )}
      </div>
      )}
      <div
        ref={proseRef}
        className={cn("note-prose relative py-1.5", compact ? "text-xs" : "text-sm")}
        onMouseMove={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") showImageTools(target as HTMLImageElement);
          else if (!(e.target as HTMLElement).closest("[data-img-tools]")) setHovered(null);
        }}
        onMouseLeave={() => setHovered(null)}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") {
            setLightbox((target as HTMLImageElement).src);
            return;
          }
          if (!mounted) setMounted(true);
        }}
      >
        {mounted ? (
          <EditorContent editor={editor} />
        ) : (
          <div
            className={cn("cursor-text", minHeight)}
            dangerouslySetInnerHTML={{ __html: content || "<p></p>" }}
          />
        )}

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



      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Imagem da nota</DialogTitle>
          </DialogHeader>
          {lightbox && (
            <img
              src={lightbox}
              alt="Imagem ampliada da nota"
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
