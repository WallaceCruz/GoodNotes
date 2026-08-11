import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { NOTE_COLORS, type Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { ChecklistEditor } from "./ChecklistEditor";
import { noteBg, noteLabel, stripHtml } from "./note-style";
import { DeadlineBadge, PriorityBadge, PriorityDeadlineControls } from "./NoteMeta";
import { SubnoteDeck } from "./SubnoteDeck";
import { TagEditor } from "./TagEditor";

export function StickyNoteCard({
  note,
  active,
  store,
  onOpen,
}: {
  note: Note;
  active: boolean;
  store: BoardStore;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });
  const [expanded, setExpanded] = useState(false);
  const onChange = (patch: Partial<Note>) => store.updateNote(note.id, patch);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onOpen}
      className={cn(
        "group cursor-pointer rounded-lg border border-border/60 p-3 shadow-sm transition-shadow hover:shadow-md",
        noteBg[note.color],
        isDragging && "opacity-50",
        note.archived && "opacity-60 grayscale",
        active && "ring-2 ring-ring",
      )}
    >
      <div className="flex items-center gap-1 pb-1.5">
        <button
          {...attributes}
          {...listeners}
          aria-label="Mover nota"
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab text-foreground/40"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-1">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Cor ${noteLabel[c]}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange({ color: c });
              }}
              className={cn(
                "h-3 w-3 rounded-full border border-border/70",
                noteBg[c],
                note.color === c && "ring-1 ring-ring",
              )}
            />
          ))}
        </div>
        <button
          aria-label={note.archived ? "Restaurar nota" : "Arquivar nota"}
          onClick={(e) => {
            e.stopPropagation();
            store.setNoteArchived(note.id, !note.archived);
          }}
          className="ml-auto opacity-0 group-hover:opacity-100"
        >
          {note.archived ? (
            <ArchiveRestore className="h-3.5 w-3.5 text-foreground/50" />
          ) : (
            <Archive className="h-3.5 w-3.5 text-foreground/50" />
          )}
        </button>
        <button
          aria-label="Excluir nota"
          onClick={(e) => {
            e.stopPropagation();
            store.removeNote(note.id);
          }}
          className="opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5 text-foreground/50" />
        </button>
      </div>

      {(note.priority || note.deadline) && (
        <div className="flex flex-wrap items-center gap-1 pb-1">
          {note.priority && <PriorityBadge priority={note.priority} />}
          {note.deadline && <DeadlineBadge deadline={note.deadline} />}
        </div>
      )}

      <input
        value={note.title}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange({ title: e.target.value })}
        aria-label="Título da nota"
        className="w-full bg-transparent text-[15px] font-semibold leading-snug text-foreground outline-none"
      />

      <textarea
        value={stripHtml(note.content)}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange({ content: `<p>${e.target.value}</p>` })}
        rows={3}
        placeholder="Escreva aqui..."
        aria-label="Conteúdo da nota"
        className="mt-1 w-full resize-none bg-transparent text-xs leading-relaxed text-foreground/75 outline-none"
      />

      {note.images.length > 0 && (
        <div className="mt-1.5 grid grid-cols-2 gap-1.5" onClick={(e) => e.stopPropagation()}>
          {note.images.slice(0, 4).map((img) =>
            img.link ? (
              <a key={img.id} href={img.link} target="_blank" rel="noreferrer noopener">
                <img
                  src={img.url}
                  alt="Imagem da nota"
                  loading="lazy"
                  className="h-20 w-full rounded-md border border-border/50 object-cover"
                />
              </a>
            ) : (
              <img
                key={img.id}
                src={img.url}
                alt="Imagem da nota"
                loading="lazy"
                className="h-20 w-full rounded-md border border-border/50 object-cover"
              />
            ),
          )}
        </div>
      )}

      <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
        <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} />
      </div>

      <div className="mt-1.5">
        <PriorityDeadlineControls note={note} onChange={onChange} />
      </div>

      {note.checklist.length > 0 && (
        <div className="mt-2">
          <ChecklistEditor
            items={note.checklist}
            onAdd={(text) => store.addChecklistItem(note.id, text)}
            onUpdate={(id, patch) => store.updateChecklistItem(note.id, id, patch)}
            onRemove={(id) => store.removeChecklistItem(note.id, id)}
          />
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="mt-2 flex w-full items-center gap-1 text-[11px] text-foreground/60"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {note.subnotes.length} subtarefa{note.subnotes.length === 1 ? "" : "s"}
      </button>

      {expanded && (
        <div className="mt-2 space-y-3">
          {note.checklist.length === 0 && (
            <ChecklistEditor
              items={note.checklist}
              onAdd={(text) => store.addChecklistItem(note.id, text)}
              onUpdate={(id, patch) => store.updateChecklistItem(note.id, id, patch)}
              onRemove={(id) => store.removeChecklistItem(note.id, id)}
            />
          )}
          <SubnoteDeck
            subnotes={note.subnotes}
            compact
            onAdd={(text, color, status) => store.addSubnote(note.id, text, color, status)}
            onUpdate={(subId, text) => store.updateSubnote(note.id, subId, text)}
            onMove={(subId, status) => store.moveSubnote(note.id, subId, status)}
            onRemove={(subId) => store.removeSubnote(note.id, subId)}
          />
        </div>
      )}
    </div>
  );
}
