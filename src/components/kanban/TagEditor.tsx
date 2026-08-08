import { Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function TagEditor({
  tags,
  onChange,
  size = "sm",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  size?: "sm" | "md";
}) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const commit = () => {
    const t = value.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setValue("");
    setAdding(false);
  };

  const text = size === "sm" ? "text-[10px]" : "text-[11px]";

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((t) => (
        <span
          key={t}
          className={cn(
            "group/tag flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-foreground/70",
            text,
          )}
        >
          #{t}
          <button
            aria-label={`Remover tag ${t}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(tags.filter((x) => x !== t));
            }}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={value}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setAdding(false);
          }}
          placeholder="tag"
          aria-label="Nova tag"
          className={cn("w-16 rounded-full bg-foreground/10 px-2 py-0.5 outline-none", text)}
        />
      ) : (
        <button
          aria-label="Adicionar tag"
          onClick={(e) => {
            e.stopPropagation();
            setAdding(true);
          }}
          className={cn(
            "flex items-center gap-0.5 rounded-full border border-dashed border-foreground/25 px-1.5 py-0.5 text-foreground/50",
            text,
          )}
        >
          <Plus className="h-2.5 w-2.5" />
          tag
        </button>
      )}
    </div>
  );
}
