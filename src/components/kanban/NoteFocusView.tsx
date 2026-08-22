import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Eye, Pin, PinOff, X } from "lucide-react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { type Note } from "@/lib/board-types";
import { ChecklistEditor } from "./ChecklistEditor";
import { NoteEditorPanel } from "./NoteEditorPanel";
import { RichNoteEditor } from "./RichNoteEditor";
import { cn } from "@/lib/utils";
import { noteBg, timeAgo } from "./note-style";

// Guarda a rolagem da página de detalhes por nota, para reabrir onde parou.
const focusScroll = new Map<string, number>();

export function NoteFocusView({
  note,
  store,
  mode = "view",
  onClose,
}: {
  note: Note;
  store: BoardStore;
  mode?: "view" | "edit";
  onClose: () => void;
}) {
  const onChange = (patch: Partial<Note>) => store.updateNote(note.id, patch);
  const isNotepad = note.kind === "notepad";
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(mode === "edit");
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
        if (inNested) return;
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
      style={!isNotepad && note.colorHex ? { backgroundColor: note.colorHex } : undefined}
      className={cn(
        "rounded-2xl border border-border/70 p-8 shadow-focus",
        isNotepad ? "bg-card" : cn(!note.colorHex && noteBg[note.color], "text-note-foreground"),
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
            maxHeight="max-h-[64vh]"
            checklistActive={note.showChecklist}
            onToggleChecklist={() => onChange({ showChecklist: !note.showChecklist })}
          />
        ) : (
          <div
            className="note-prose scroll-thin max-h-[64vh] min-h-[40vh] overflow-y-auto text-sm"
            dangerouslySetInnerHTML={{ __html: note.content || "<p></p>" }}
          />
        )}
      </div>

      {note.showChecklist && (
        <div className="mt-5">
          <ChecklistEditor
            items={note.checklist}
            onAdd={(text) => store.addChecklistItem(note.id, text)}
            onUpdate={(id, patch) => store.updateChecklistItem(note.id, id, patch)}
            onRemove={(id) => store.removeChecklistItem(note.id, id)}
          />
        </div>
      )}
    </article>
  );

  const overlayClass = cn(
    "fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm sm:p-8",
    closing
      ? "animate-out fade-out-0 duration-150 ease-in"
      : "animate-in fade-in-0 duration-200 ease-out",
  );
  const enterClass = closing
    ? "animate-out zoom-out-95 duration-150 ease-in"
    : "animate-in zoom-in-95 duration-200 ease-out";

  // Modo visualização: apenas o card da nota, fecha clicando fora.
  if (!editing) {
    return (
      <div
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
        className={overlayClass}
      >
        <div
          className={cn(
            "scroll-thin max-h-[92vh] w-full max-w-3xl overflow-y-auto",
            enterClass,
          )}
        >
          {article}
        </div>
      </div>
    );
  }

  // Modo edição: nota + sidebar de detalhes.
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      className={overlayClass}
    >
      <div
        className={cn(
          "flex h-[92vh] w-full max-w-[80rem] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
          enterClass,
        )}
      >
        <div
          ref={scrollRef}
          onScroll={(e) => focusScroll.set(note.id, e.currentTarget.scrollTop)}
          className="scroll-thin min-w-0 flex-1 overflow-y-auto bg-muted/40 px-6 py-6"
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={requestClose}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao quadro
              </button>
              <span className="text-[11px] text-muted-foreground">
                {isNotepad ? "Bloco de notas" : "Nota autoadesiva"} · editado{" "}
                {timeAgo(note.updatedAt)}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => store.setNotePinned(note.id, !note.pinned)}
                  title={note.pinned ? "Desafixar" : "Fixar"}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent",
                    note.pinned ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {note.pinned ? (
                    <PinOff className="h-3.5 w-3.5" />
                  ) : (
                    <Pin className="h-3.5 w-3.5" />
                  )}
                  {note.pinned ? "Desafixar" : "Fixar"}
                </button>
                <button
                  onClick={() => store.setNoteArchived(note.id, !note.archived)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                >
                  {note.archived ? (
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                  {note.archived ? "Restaurar" : "Arquivar"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Visualizar
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

            {article}
          </div>
        </div>

        <NoteEditorPanel note={note} store={store} onClose={requestClose} />
      </div>
    </div>
  );
}
