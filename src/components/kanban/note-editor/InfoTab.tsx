import { useState } from "react";
import { Archive, ArchiveRestore, Copy, Pin, PinOff, Trash2 } from "lucide-react";
import {
  noteAssignees,
  PRIORITIES,
  PRIORITY_ICON,
  PRIORITY_LABEL,
  type Note,
} from "@/lib/board-types";
import { boardActions, useActiveFile, useActiveProject, useFileColumns } from "@/stores/board";
import { timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";
import { priorityClass } from "../note-style";
import { AssigneeSelect } from "../AssigneeSelect";
import { CategorySelect } from "../CategorySelect";
import { DeadlinePicker } from "../DeadlinePicker";
import { StatusSelect } from "../StatusSelect";
import { TagEditor } from "../TagEditor";
import { ActionRow, Group } from "./panel-controls";

type Section = "info" | "acoes";

const SECTIONS: Array<[Section, string]> = [
  ["info", "Informações"],
  ["acoes", "Ações"],
];

function Properties({ note }: { note: Note }) {
  const activeProject = useActiveProject();
  const activeFile = useActiveFile();
  const column = useFileColumns()?.find((c) => c.id === note.columnId);
  const location = [activeProject?.name, activeFile?.name, column?.title]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Group title="Propriedades">
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Atualizado</dt>
            <dd>{timeAgo(note.updatedAt)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Autor</dt>
            <dd>{note.author}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Tipo</dt>
            <dd>Nota autoadesiva</dd>
          </div>
        </dl>
      </Group>

      <Group title="Localização">
        <p className="text-xs text-muted-foreground">{location}</p>
      </Group>
    </>
  );
}

/** Metadados da nota (quem, quando, com que prioridade) e as ações sobre ela. */
export function InfoTab({
  note,
  onChange,
  onClose,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  onClose: () => void;
}) {
  const [section, setSection] = useState<Section>("info");

  return (
    <>
      <div className="flex rounded-lg bg-muted p-0.5">
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-[13px] transition-colors",
              section === id
                ? "bg-background font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "info" ? (
        <>
          <Group title="Responsáveis">
            <AssigneeSelect
              value={noteAssignees(note)}
              onChange={(names) => onChange({ assignees: names, assignee: names[0] ?? null })}
              size="md"
              variant="cta"
            />
          </Group>

          <Group title="Etiquetas">
            <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} size="md" />
          </Group>

          <Group title="Status">
            <StatusSelect value={note.status} onChange={(status) => onChange({ status })} />
          </Group>

          <Group title="Categoria">
            <CategorySelect value={note.category} onChange={(category) => onChange({ category })} />
          </Group>

          <Group title="Prioridade">
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  onClick={() =>
                    onChange({ priority: note.priority === priority ? null : priority })
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    note.priority === priority
                      ? priorityClass[priority]
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {PRIORITY_ICON[priority]} {PRIORITY_LABEL[priority]}
                </button>
              ))}
            </div>
          </Group>

          <Group title="Prazo de conclusão">
            <DeadlinePicker value={note.deadline} onChange={(deadline) => onChange({ deadline })} />
          </Group>

          <Properties note={note} />
        </>
      ) : (
        <Group title="Ações">
          <div className="space-y-0.5">
            <ActionRow
              label={note.pinned ? "Desafixar do topo" : "Fixar no topo"}
              icon={note.pinned ? PinOff : Pin}
              onClick={() => boardActions.setNotePinned(note.id, !note.pinned)}
            />
            <ActionRow
              label="Duplicar"
              icon={Copy}
              onClick={() => boardActions.duplicateNote(note.id)}
            />
            <ActionRow
              label={note.archived ? "Restaurar" : "Arquivar"}
              icon={note.archived ? ArchiveRestore : Archive}
              onClick={() => boardActions.setNoteArchived(note.id, !note.archived)}
            />
            <ActionRow
              label="Excluir"
              icon={Trash2}
              danger
              onClick={() => {
                boardActions.removeNote(note.id);
                onClose();
              }}
            />
          </div>
        </Group>
      )}
    </>
  );
}
