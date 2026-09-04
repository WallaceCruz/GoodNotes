import { Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import {
  AUTOMATION_LABEL,
  PRIORITIES,
  PRIORITY_ICON,
  PRIORITY_LABEL,
  type AutomationType,
} from "@/lib/board/model";
import { boardActions, useActiveFile } from "@/stores/board";
import { cn } from "@/lib/utils";

const TYPES: AutomationType[] = ["tag", "priority", "checklist-done"];

export function AutomationsPanel({ allTags }: { allTags: string[] }) {
  const file = useActiveFile();
  const [type, setType] = useState<AutomationType>("tag");
  const [value, setValue] = useState("");
  const [columnId, setColumnId] = useState("");

  if (!file) return null;
  const target = columnId || file.columns[0]?.id || "";

  const needsValue = type === "tag" || type === "priority";

  const add = () => {
    if (!target) return;
    if (needsValue && !value.trim()) return;
    boardActions.addAutomation(type, value.trim(), target);
    setValue("");
  };

  return (
    <div className="border-b border-border bg-background/80 px-4 py-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Automações</h2>
        <span className="text-xs text-muted-foreground">
          movem notas automaticamente entre colunas
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AutomationType)}
          aria-label="Condição da automação"
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {AUTOMATION_LABEL[t]}
            </option>
          ))}
        </select>

        {type === "tag" && (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            list="automation-tags"
            placeholder="tag"
            aria-label="Tag da automação"
            className="w-32 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none"
          />
        )}
        <datalist id="automation-tags">
          {allTags.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>

        {type === "priority" && (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Prioridade da automação"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
          >
            <option value="">Selecione</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        )}

        <span className="text-xs text-muted-foreground">mover para</span>
        <select
          value={target}
          onChange={(e) => setColumnId(e.target.value)}
          aria-label="Coluna de destino"
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          {file.columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <button
          onClick={add}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Criar regra
        </button>
      </div>

      <ul className="mt-2 flex flex-wrap gap-2">
        {file.automations.length === 0 && (
          <li className="text-[11px] text-muted-foreground">Nenhuma automação criada.</li>
        )}
        {file.automations.map((a) => (
          <li
            key={a.id}
            className={cn(
              "flex items-center gap-2 rounded-full border border-border px-2 py-1 text-[11px]",
              !a.enabled && "opacity-50",
            )}
          >
            <button onClick={() => boardActions.toggleAutomation(a.id)} className="font-medium">
              {AUTOMATION_LABEL[a.type]}
              {a.value ? ` "${a.value}"` : ""} →{" "}
              {file.columns.find((c) => c.id === a.columnId)?.title ?? "—"}
            </button>
            <button
              onClick={() => boardActions.removeAutomation(a.id)}
              aria-label="Excluir automação"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
