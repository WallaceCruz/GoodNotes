import {
  Bold,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { Group, IconButton, StyleButton } from "./panel-controls";

const HIGHLIGHTS = [
  { label: "Amarelo", value: "#fde68a" },
  { label: "Verde", value: "#bbf7d0" },
  { label: "Azul", value: "#bae6fd" },
  { label: "Rosa", value: "#fbcfe8" },
  { label: "Laranja", value: "#fed7aa" },
  { label: "Roxo", value: "#ddd6fe" },
];

/** Estilos de texto do editor, na ordem em que o documento os usa. */
const TEXT_STYLES = [
  { label: "Título", level: 1 },
  { label: "Subtítulo", level: 2 },
  { label: "Seção", level: 3 },
  { label: "Forte", level: 4 },
  { label: "Corpo", level: null },
  { label: "Legenda", level: 5 },
] as const;

/** Formatação do texto selecionado: estilos, marcações, listas e realce. */
export function FormatTab({
  enabled,
  run,
  isActive,
}: {
  enabled: boolean;
  run: (command: (editor: Editor) => void) => () => void;
  isActive: (name: string, attributes?: Record<string, unknown>) => boolean;
}) {
  const marks = [
    {
      label: "Negrito",
      icon: Bold,
      key: "bold",
      apply: (e: Editor) => e.chain().focus().toggleBold().run(),
    },
    {
      label: "Itálico",
      icon: Italic,
      key: "italic",
      apply: (e: Editor) => e.chain().focus().toggleItalic().run(),
    },
    {
      label: "Sublinhado",
      icon: UnderlineIcon,
      key: "underline",
      apply: (e: Editor) => e.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Tachado",
      icon: Strikethrough,
      key: "strike",
      apply: (e: Editor) => e.chain().focus().toggleStrike().run(),
    },
    {
      label: "Código",
      icon: Code,
      key: "code",
      apply: (e: Editor) => e.chain().focus().toggleCode().run(),
    },
  ];

  const blocks = [
    {
      label: "Lista",
      icon: List,
      key: "bulletList",
      apply: (e: Editor) => e.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Lista numerada",
      icon: ListOrdered,
      key: "orderedList",
      apply: (e: Editor) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Citação",
      icon: Quote,
      key: "blockquote",
      apply: (e: Editor) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Bloco de código",
      icon: Code,
      key: "codeBlock",
      apply: (e: Editor) => e.chain().focus().toggleCodeBlock().run(),
    },
  ];

  const toggleLink = (editor: Editor) => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Cole o endereço do link (https://...)");
    if (url?.trim()) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    }
  };

  return (
    <>
      {!enabled && (
        <p className="mb-2 text-[11px] text-muted-foreground">
          Clique no texto da nota para habilitar a formatação.
        </p>
      )}

      <Group title="Texto">
        <div className="grid grid-cols-3 gap-1.5">
          {TEXT_STYLES.map(({ label, level }) => (
            <StyleButton
              key={label}
              label={label}
              disabled={!enabled}
              active={level === null ? isActive("paragraph") : isActive("heading", { level })}
              onClick={run((editor) =>
                level === null
                  ? editor.chain().focus().setParagraph().run()
                  : editor.chain().focus().toggleHeading({ level }).run(),
              )}
            />
          ))}
        </div>
      </Group>

      <Group title="Marcações">
        <div className="grid grid-cols-4 gap-1.5">
          {marks.map(({ label, icon, key, apply }) => (
            <IconButton
              key={label}
              label={label}
              icon={icon}
              disabled={!enabled}
              active={isActive(key)}
              onClick={run(apply)}
            />
          ))}
          <IconButton
            label="Hiperlink"
            icon={Link2}
            disabled={!enabled}
            active={isActive("link")}
            onClick={run(toggleLink)}
          />
          <IconButton
            label="Limpar formatação"
            icon={RemoveFormatting}
            disabled={!enabled}
            onClick={run((editor) => editor.chain().focus().unsetAllMarks().clearNodes().run())}
          />
        </div>
      </Group>

      <Group title="Listas e blocos">
        <div className="grid grid-cols-4 gap-1.5">
          {blocks.map(({ label, icon, key, apply }) => (
            <IconButton
              key={label}
              label={label}
              icon={icon}
              disabled={!enabled}
              active={isActive(key)}
              onClick={run(apply)}
            />
          ))}
        </div>
      </Group>

      <Group title="Cor de realce">
        <div className="flex flex-wrap items-center gap-2">
          {HIGHLIGHTS.map((highlight) => (
            <button
              key={highlight.value}
              title={highlight.label}
              aria-label={`Realce ${highlight.label}`}
              disabled={!enabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={run((editor) =>
                editor.chain().focus().setHighlight({ color: highlight.value }).run(),
              )}
              className="h-7 w-7 rounded-full border border-border disabled:opacity-40"
              style={{ backgroundColor: highlight.value }}
            />
          ))}
          <button
            disabled={!enabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={run((editor) => editor.chain().focus().unsetHighlight().run())}
            className="h-7 rounded-full border border-border px-2.5 text-[11px] text-muted-foreground hover:bg-accent disabled:opacity-40"
          >
            Limpar
          </button>
        </div>
      </Group>
    </>
  );
}
