import {
  Archive,
  ArchiveRestore,
  Calendar,
  Check,
  Copy,
  MoreHorizontal,
  Palette,
  Pencil,
  Pin,
  PinOff,
  Tag as TagIcon,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MEMBERS,
  NOTE_COLORS,
  PRIORITIES,
  PRIORITY_ICON,
  PRIORITY_LABEL,
  initials,
  noteAssignees,
  type Note,
  type NoteColor,
} from "@/lib/board-types";
import { boardActions, useFileTags } from "@/stores/board";
import { addDays, endOfDay } from "@/lib/date";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel, priorityClass } from "./note-style";
import { StatusSelect } from "./StatusSelect";
import { TagManager } from "./TagEditor";

const QUICK_DEADLINE = [
  { label: "Hoje", days: 0 },
  { label: "Amanhã", days: 1 },
  { label: "Em 7 dias", days: 7 },
];

/** Menu de "mais opções" (três pontos) da nota — inclui trocas rápidas de cor, status, prioridade, responsável, prazo e tags sem abrir a nota inteira. */
export function NoteOptionsMenu({ note, onOpen }: { note: Note; onOpen: () => void }) {
  const title = note.title || "Nota";
  const assignees = noteAssignees(note);
  const [tagQuery, setTagQuery] = useState("");
  const [tagColor, setTagColor] = useState<NoteColor>("sky");
  const fileTags = useFileTags() ?? [];

  const toggleAssignee = (name: string) => {
    const next = assignees.includes(name)
      ? assignees.filter((n) => n !== name)
      : [...assignees, name];
    boardActions.updateNote(note.id, { assignees: next, assignee: next[0] ?? null });
  };

  const toggleTag = (name: string) => {
    const next = note.tags.includes(name)
      ? note.tags.filter((t) => t !== name)
      : [...note.tags, name];
    boardActions.updateNote(note.id, { tags: next });
  };
  const createTag = () => {
    const name = tagQuery.trim().toLowerCase();
    if (!name) return;
    boardActions.addTag(name, tagColor);
    if (!note.tags.includes(name)) toggleTag(name);
    setTagQuery("");
  };
  const filteredTags = fileTags
    .filter((d) => d.name.includes(tagQuery.trim().toLowerCase()))
    .map((d) => d.name);
  const tagExists = fileTags.some((d) => d.name === tagQuery.trim().toLowerCase());

  return (
    <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Mais opções"
            title="Mais opções"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded text-foreground/60 opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground",
              "group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onOpen}>
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => boardActions.setNotePinned(note.id, !note.pinned)}>
            {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {note.pinned ? "Desafixar" : "Fixar no topo"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              boardActions.duplicateNote(note.id);
              toast.success("Nota duplicada");
            }}
          >
            <Copy className="h-4 w-4" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => boardActions.setNoteArchived(note.id, !note.archived)}>
            {note.archived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            {note.archived ? "Restaurar" : "Arquivar"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Palette className="h-4 w-4" />
              Cor da nota
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-2">
              <div className="flex max-w-40 flex-wrap gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    aria-label={noteLabel[c]}
                    title={noteLabel[c]}
                    onClick={() => boardActions.updateNote(note.id, { color: c, colorHex: null })}
                    className={cn(
                      "h-6 w-6 rounded-full border border-border",
                      noteBg[c],
                      note.color === c &&
                        !note.colorHex &&
                        "ring-2 ring-ring ring-offset-1 ring-offset-popover",
                    )}
                  />
                ))}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Check className="h-4 w-4" />
              Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 p-2">
              <StatusSelect
                value={note.status}
                onChange={(status) => boardActions.updateNote(note.id, { status })}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="text-sm leading-none">
                {PRIORITY_ICON[note.priority ?? "medium"]}
              </span>
              Prioridade
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44 p-2">
              <div className="flex flex-col gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      boardActions.updateNote(note.id, {
                        priority: note.priority === p ? null : p,
                      })
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
                      note.priority === p ? priorityClass[p] : "hover:bg-accent",
                    )}
                  >
                    {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
                    {note.priority === p && <Check className="ml-auto h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus className="h-4 w-4" />
              Responsável
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52 p-1">
              {MEMBERS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleAssignee(m.name)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                    {initials(m.name)}
                  </span>
                  {m.name}
                  {assignees.includes(m.name) && <Check className="ml-auto h-3.5 w-3.5" />}
                </button>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Calendar className="h-4 w-4" />
              Prazo de conclusão
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44 p-2">
              <div className="flex flex-col gap-1">
                {QUICK_DEADLINE.map((q) => (
                  <button
                    key={q.label}
                    onClick={() =>
                      boardActions.updateNote(note.id, {
                        deadline: endOfDay(addDays(Date.now(), q.days)).getTime(),
                      })
                    }
                    className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    {q.label}
                  </button>
                ))}
                {note.deadline && (
                  <button
                    onClick={() => boardActions.updateNote(note.id, { deadline: null })}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remover prazo
                  </button>
                )}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <TagIcon className="h-4 w-4" />
              Etiquetas
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-[19rem] p-0">
              <TagManager
                selected={note.tags}
                onToggle={toggleTag}
                query={tagQuery}
                setQuery={setTagQuery}
                color={tagColor}
                setColor={setTagColor}
                onCreate={createTag}
                filtered={filteredTags}
                canCreate={!!tagQuery.trim() && !tagExists}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              boardActions.removeNote(note.id);
              toast.success(`"${title}" excluída`, {
                action: { label: "Desfazer", onClick: () => boardActions.restoreNote(note) },
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
