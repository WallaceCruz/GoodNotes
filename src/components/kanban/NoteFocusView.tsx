import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Eye, Pencil, Pin, PinOff, X } from "lucide-react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { type Note } from "@/lib/board-types";
import { ChecklistEditor } from "./ChecklistEditor";
import { RichNoteEditor } from "./RichNoteEditor";
import { cn } from "@/lib/utils";
import { noteBg, timeAgo } from "./note-style";

// Guarda a rolagem da página de detalhes por nota, para reabrir onde parou.
const focusScroll = new Map<string, number>();

export function NoteFocusView({
  note,
  store,
  onClose,
}: {
  note: Note;
  store: BoardStore;
  onClose: () => void;
}) {
  const onChange = (patch: Partial<Note>) => store.updateNote(note.id, patch);
  const isNotepad = note.kind === "notepad";
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const closingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[role='dialog']")) return;
      requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm sm:p-8",
        closing
          ? "animate-out fade-out-0 duration-150 ease-in"
          : "animate-in fade-in-0 duration-200 ease-out",
      )}
    >
      <div
        className={cn(
          "flex h-[92vh] w-full max-w-[80rem] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
          closing
            ? "animate-out zoom-out-95 duration-150 ease-in"
            : "animate-in zoom-in-95 duration-200 ease-out",
        )}
      >
      {/* Canvas central em foco */}
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
              {isNotepad ? "Bloco de notas" : "Nota autoadesiva"} · editado {timeAgo(note.updatedAt)}
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
                {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                {note.pinned ? "Desafixar" : "Fixar"}
              </button>
              <button
                onClick={() => store.setNoteArchived(note.id, !note.archived)}
                title={note.archived ? "Restaurar" : "Arquivar"}
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
                onClick={() => setEditing((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs",
                  editing ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
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

          <article
            style={
              !isNotepad && note.colorHex ? { backgroundColor: note.colorHex } : undefined
            }
            className={cn(
              "rounded-2xl border border-border/70 p-8 shadow-focus",
              isNotepad
                ? "bg-card"
                : cn(!note.colorHex && noteBg[note.color], "text-note-foreground"),
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
                  minHeight="min-h-[64vh]"
                  maxHeight="max-h-[72vh]"
                  checklistActive={note.showChecklist}
                  onToggleChecklist={() => onChange({ showChecklist: !note.showChecklist })}
                />
              ) : (
                <div
                  className="note-prose scroll-thin max-h-[72vh] min-h-[64vh] overflow-y-auto text-sm"
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
        </div>
      </div>

      </div>
    </div>
  );
}
