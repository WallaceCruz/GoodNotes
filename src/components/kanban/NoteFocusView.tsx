import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, X } from "lucide-react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { NOTE_COLORS, PRIORITIES, PRIORITY_ICON, PRIORITY_LABEL, type Note } from "@/lib/board-types";
import { AssigneeSelect } from "./AssigneeSelect";
import { ChecklistEditor } from "./ChecklistEditor";
import { DeadlinePicker } from "./DeadlinePicker";
import { RichNoteEditor } from "./RichNoteEditor";
import { TagEditor } from "./TagEditor";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel, priorityClass, timeAgo } from "./note-style";

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
      className={cn(
        "flex min-h-0 flex-1",
        closing
          ? "animate-out fade-out-0 zoom-out-95 duration-150 ease-in"
          : "animate-in fade-in-0 zoom-in-[0.98] duration-200 ease-out",
      )}
    >
      {/* Canvas central em foco */}
      <div
        ref={scrollRef}
        onScroll={(e) => focusScroll.set(note.id, e.currentTarget.scrollTop)}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
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
          </div>

          <article
            className={cn(
              "rounded-2xl border border-border/70 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-30px_rgba(0,0,0,0.35)]",
              isNotepad ? "bg-card" : noteBg[note.color],
            )}
          >
            <input
              value={note.title}
              onChange={(e) => onChange({ title: e.target.value })}
              aria-label="Título da nota"
              placeholder="Sem título"
              className="w-full bg-transparent text-3xl font-bold leading-tight tracking-tight outline-none placeholder:text-foreground/30"
            />

            <div className="mt-4">
              <RichNoteEditor
                content={note.content}
                onChange={(html) => onChange({ content: html })}
                minHeight="min-h-[64vh]"
                maxHeight="max-h-[72vh]"
                checklistActive={note.showChecklist}
                onToggleChecklist={() => onChange({ showChecklist: !note.showChecklist })}
              />
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

      {/* Sidebar de detalhes */}
      <aside className="scroll-thin flex w-[22rem] shrink-0 flex-col overflow-y-auto border-l border-border bg-background">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Detalhes</span>
          <button
            onClick={() => store.setNoteArchived(note.id, !note.archived)}
            className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
          >
            {note.archived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            {note.archived ? "Restaurar" : "Arquivar"}
          </button>
          <button onClick={requestClose} aria-label="Fechar nota" className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-5 p-4">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Responsável
            </p>
            <div className="mt-2">
              <AssigneeSelect
                value={note.assignee}
                onChange={(assignee) => onChange({ assignee })}
                size="md"
              />
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Etiquetas
            </p>
            <div className="mt-2">
              <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} store={store} size="md" />
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Prioridade
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => onChange({ priority: note.priority === p ? null : p })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    note.priority === p
                      ? priorityClass[p]
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Prazo de conclusão
            </p>
            <div className="mt-2">
              <DeadlinePicker value={note.deadline} onChange={(deadline) => onChange({ deadline })} />
            </div>
          </section>

          {!isNotepad && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cor da nota
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    aria-label={noteLabel[c]}
                    onClick={() => onChange({ color: c })}
                    className={cn(
                      "h-6 w-6 rounded-full border border-border",
                      noteBg[c],
                      note.color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                    )}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
