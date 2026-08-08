import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  NOTE_COLORS,
  SUB_STATUSES,
  SUB_STATUS_LABEL,
  type NoteColor,
  type SubNote,
  type SubStatus,
} from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "./note-style";
import { useState } from "react";

export function SubnoteDeck({
  subnotes,
  compact = false,
  onAdd,
  onUpdate,
  onMove,
  onRemove,
}: {
  subnotes: SubNote[];
  compact?: boolean;
  onAdd: (text: string, color: NoteColor, status: SubStatus) => void;
  onUpdate: (subId: string, text: string) => void;
  onMove: (subId: string, status: SubStatus) => void;
  onRemove: (subId: string) => void;
}) {
  const [color, setColor] = useState<NoteColor>("amber");

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
          Subtarefas
        </p>
        <div className="flex items-center gap-1">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Cor da subnota ${noteLabel[c]}`}
              onClick={() => setColor(c)}
              className={cn(
                "h-3.5 w-3.5 rounded-full border border-border",
                noteBg[c],
                color === c && "ring-2 ring-ring",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {SUB_STATUSES.map((status) => {
          const items = subnotes.filter((s) => s.status === status);
          return (
            <div key={status} className="rounded-md bg-foreground/5 p-1.5">
              <div className="flex items-center justify-between px-0.5 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground/60">
                  {SUB_STATUS_LABEL[status]}
                </span>
                <button
                  aria-label={`Adicionar subnota em ${SUB_STATUS_LABEL[status]}`}
                  onClick={() => onAdd("Nova subnota", color, status)}
                  className="text-foreground/50 hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {items.map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "group/sub relative rounded-md border border-border/60 p-1.5 shadow-sm",
                      noteBg[s.color],
                      i > 0 && "-mt-0.5",
                    )}
                  >
                    <textarea
                      value={s.text}
                      onChange={(e) => onUpdate(s.id, e.target.value)}
                      rows={compact ? 2 : 3}
                      className="w-full resize-none bg-transparent text-[11px] leading-snug outline-none"
                    />
                    <div className="flex items-center gap-1 pt-0.5">
                      <button
                        aria-label="Mover subnota para esquerda"
                        disabled={status === "todo"}
                        onClick={() =>
                          onMove(s.id, SUB_STATUSES[SUB_STATUSES.indexOf(status) - 1]!)
                        }
                        className="text-foreground/50 disabled:opacity-25"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        aria-label="Mover subnota para direita"
                        disabled={status === "done"}
                        onClick={() =>
                          onMove(s.id, SUB_STATUSES[SUB_STATUSES.indexOf(status) + 1]!)
                        }
                        className="text-foreground/50 disabled:opacity-25"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                      <button
                        aria-label="Excluir subnota"
                        onClick={() => onRemove(s.id)}
                        className="ml-auto text-foreground/50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
