import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Archive, ArchiveRestore, ArrowLeft, Eye, Pencil, Pin, PinOff, X } from "lucide-react";
import { type Note } from "@/lib/board/model";
import { boardActions } from "@/stores/board";
import { BelowChecklistNote } from "@/components/editor/BelowChecklistNote";
import { ChecklistEditor } from "@/components/note/ChecklistEditor";
import { NoteEditorPanel } from "./NoteEditorPanel";
import { RichNoteEditor } from "@/components/editor/RichNoteEditor";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/date";
import { hasRichContent } from "@/lib/html";
import { noteBg } from "@/components/note/note-style";
import { NoteRichContent } from "@/components/note/NoteRichContent";

// Guarda a rolagem da página de detalhes por nota, para reabrir onde parou.
const focusScroll = new Map<string, number>();

export function NoteFocusView({
  note,
  mode = "view",
  onClose,
}: {
  note: Note;
  mode?: "view" | "edit";
  onClose: () => void;
}) {
  const onChange = (patch: Partial<Note>) => boardActions.updateNote(note.id, patch);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(mode === "edit");
  // Instância do editor do corpo da nota, para o painel lateral agir sobre ela.
  const [editor, setEditor] = useState<Editor | null>(null);
  const closingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, 180);
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = focusScroll.get(note.id) ?? 0;
  }, [note.id]);

  // Focus trap + Esc: mantém o teclado dentro do card em foco.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable="true"],[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inNested = !!target?.closest("[role='dialog']:not([data-note-focus])");

      if (e.key === "Escape") {
        // Menu flutuante aberto (ex.: opções da tabela) trata o próprio Esc.
        if (inNested || document.querySelector("[data-floating-menu]")) return;
        e.preventDefault();
        requestClose();
        return;
      }

      if (e.key === "Tab" && !inNested) {
        const items = focusables();
        if (items.length === 0) {
          e.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = items[0]!;
        const last = items[items.length - 1]!;
        const active = document.activeElement as HTMLElement | null;
        if (!dialogRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const article = (
    <article
      // Em leitura, clicar no corpo começa a editar: pedir que o usuário ache
      // um botão para poder escrever é o atrito que esta tela tinha de pior.
      // Imagens ficam de fora para não trocar de modo quando alguém só quis
      // ampliar uma foto.
      onClick={
        editing
          ? undefined
          : (e) => {
              if ((e.target as HTMLElement).tagName !== "IMG") setEditing(true);
            }
      }
      style={note.colorHex ? { backgroundColor: note.colorHex } : undefined}
      className={cn(
        "rounded-2xl border border-border/70 p-8 text-note-foreground shadow-focus",
        !editing && "cursor-text",
        !note.colorHex && noteBg[note.color],
      )}
    >
      {editing ? (
        <input
          value={note.title}
          onChange={(e) => onChange({ title: e.target.value })}
          aria-label="Título da nota"
          placeholder="Sem título"
          className="w-full bg-transparent text-3xl font-bold leading-tight tracking-tight outline-none placeholder:text-foreground/30"
        />
      ) : (
        <h2 className="text-3xl font-bold leading-tight tracking-tight">
          {note.title || "Sem título"}
        </h2>
      )}

      <div className="mt-4">
        {editing ? (
          <RichNoteEditor
            content={note.content}
            onChange={(html) => onChange({ content: html })}
            minHeight="min-h-[52vh]"
            blocks
            onEditor={setEditor}
          />
        ) : (
          <NoteRichContent
            html={note.content}
            fallback="<p></p>"
            zoomable
            className="note-prose min-h-[40vh] text-sm"
          />
        )}
      </div>

      {note.showChecklist && (
        <div className="mt-5">
          <ChecklistEditor
            items={note.checklist}
            onAdd={(text) => boardActions.addChecklistItem(note.id, text)}
            onUpdate={(id, patch) => boardActions.updateChecklistItem(note.id, id, patch)}
            onRemove={(id) => boardActions.removeChecklistItem(note.id, id)}
          />
        </div>
      )}

      {editing
        ? (note.showChecklist || hasRichContent(note.contentBelow)) && (
            <div className="mt-4">
              <BelowChecklistNote
                value={note.contentBelow ?? ""}
                onChange={(html) => onChange({ contentBelow: html })}
              />
            </div>
          )
        : hasRichContent(note.contentBelow) && (
            <NoteRichContent
              html={note.contentBelow}
              zoomable
              className="note-prose mt-5 text-sm"
            />
          )}
    </article>
  );

  const barButton =
    "flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent";

  /**
   * O mesmo cabeçalho nos dois modos.
   *
   * Antes o modo de leitura não tinha cabeçalho nenhum: nem fechar, nem editar,
   * nem fixar — só dava para sair clicando fora, e para escrever era preciso
   * fechar a nota e reabrir por outro caminho.
   */
  const toolbar = (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button onClick={requestClose} className={barButton}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao quadro
      </button>
      <span className="text-[11px] text-muted-foreground">
        Nota autoadesiva · editado {timeAgo(note.updatedAt)}
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => boardActions.setNotePinned(note.id, !note.pinned)}
          title={note.pinned ? "Desafixar" : "Fixar"}
          className={cn(barButton, note.pinned && "text-foreground")}
        >
          {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          {note.pinned ? "Desafixar" : "Fixar"}
        </button>
        <button
          onClick={() => boardActions.setNoteArchived(note.id, !note.archived)}
          className={barButton}
        >
          {note.archived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          {note.archived ? "Restaurar" : "Arquivar"}
        </button>
        <button onClick={() => setEditing((value) => !value)} className={barButton}>
          {editing ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          {editing ? "Visualizar" : "Editar"}
        </button>
        <button
          onClick={requestClose}
          aria-label="Fechar nota"
          className="flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // Tela cheia de verdade nos dois modos. Ler e escrever eram dois enquadramentos
  // diferentes — um cartão de 730px flutuando sobre o quadro borrado e uma janela
  // inteira —, então alternar reposicionava o texto todo debaixo do cursor. O que
  // muda entre os modos agora é só o painel lateral do editor.
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background",
        closing
          ? "animate-out fade-out-0 duration-150 ease-in"
          : "animate-in fade-in-0 duration-150",
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={note.title || "Nota"}
        data-note-focus=""
        tabIndex={-1}
        className="flex h-full w-full overflow-hidden bg-background outline-none"
      >
        <div
          ref={scrollRef}
          onScroll={(e) => focusScroll.set(note.id, e.currentTarget.scrollTop)}
          className="scroll-thin min-w-0 flex-1 overflow-y-auto bg-muted/40 px-8 py-6"
        >
          <div className="mx-auto w-full max-w-4xl">
            {toolbar}
            {article}
          </div>
        </div>

        {editing && <NoteEditorPanel note={note} editor={editor} onClose={requestClose} />}
      </div>
    </div>
  );
}
