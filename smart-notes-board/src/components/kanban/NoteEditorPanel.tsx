import { useState } from "react";
import { Archive, ArchiveRestore, X } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { boardActions } from "@/stores/board";
import { cn } from "@/lib/utils";
import { FormatTab } from "./note-editor/FormatTab";
import { InfoTab } from "./note-editor/InfoTab";
import { InsertTab } from "./note-editor/InsertTab";
import { StyleTab } from "./note-editor/StyleTab";
import { useEditorSelection } from "./note-editor/useEditorSelection";
import type { Note } from "@/lib/board/model";

const TABS = ["Inserir", "Formato", "Estilo", "Info"] as const;
type Tab = (typeof TABS)[number];

/**
 * Painel lateral da nota aberta.
 *
 * Este arquivo só decide qual aba mostrar; cada aba é um componente com o seu
 * próprio estado (a grade da tabela, a sub-aba de ações), o que evita que o
 * painel inteiro re-renderize por causa de um detalhe de uma aba fechada.
 */
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
  const { run, isActive, enabled } = useEditorSelection(editor);
  const onChange = (patch: Partial<Note>) => boardActions.updateNote(note.id, patch);

  return (
    <section className="flex w-[22rem] shrink-0 flex-col border-l border-border bg-background">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-semibold">Nota</span>
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
        {TABS.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={cn(
              "text-[13px] transition-colors",
              tab === name
                ? "font-semibold text-foreground"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            {name}
          </button>
        ))}
      </nav>

      <div className="scroll-thin flex-1 overflow-y-auto px-3 py-3">
        {tab === "Inserir" && (
          <InsertTab note={note} editor={editor} enabled={enabled} run={run} onChange={onChange} />
        )}
        {tab === "Formato" && <FormatTab enabled={enabled} run={run} isActive={isActive} />}
        {tab === "Estilo" && <StyleTab note={note} onChange={onChange} />}
        {tab === "Info" && <InfoTab note={note} onChange={onChange} onClose={onClose} />}
      </div>
    </section>
  );
}
