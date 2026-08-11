import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ChecklistItem } from "@/lib/board-types";

export function ChecklistEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: ChecklistItem[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, patch: { text?: string; done?: boolean }) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const done = items.filter((i) => i.done).length;
  const pct = items.length === 0 ? 0 : Math.round((done / items.length) * 100);

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft("");
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
          Checklist
        </p>
        <span className="text-[10px] text-foreground/60">
          {done}/{items.length} · {pct}%
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-2 space-y-1">
        {items.map((i) => (
          <li key={i.id} className="group/chk flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={i.done}
              aria-label={`Concluir ${i.text}`}
              onChange={(e) => onUpdate(i.id, { done: e.target.checked })}
              className="h-3.5 w-3.5 accent-current"
            />
            <input
              value={i.text}
              onChange={(e) => onUpdate(i.id, { text: e.target.value })}
              className={`w-full bg-transparent text-[12px] outline-none ${
                i.done ? "text-foreground/50 line-through" : ""
              }`}
            />
            <button
              aria-label="Remover item"
              onClick={() => onRemove(i.id)}
              className="opacity-0 group-hover/chk:opacity-100"
            >
              <Trash2 className="h-3 w-3 text-foreground/50" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-1.5 flex items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Novo item"
          aria-label="Novo item do checklist"
          className="w-full rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] outline-none"
        />
        <button onClick={add} aria-label="Adicionar item" className="text-foreground/60">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
