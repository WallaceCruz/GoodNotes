import { Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

export function CategoryBadge({ category }: { category: string }) {
  const { findCategory } = useCategories();
  const cat = findCategory(category);
  if (!cat) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
      <span aria-hidden>{cat.emoji}</span>
      {cat.name}
    </span>
  );
}

export function CategorySelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { categories, custom, addCategory, removeCategory, findCategory } = useCategories();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const current = findCategory(value);

  const create = () => {
    const cat = addCategory(name, emoji);
    if (!cat) return;
    onChange(cat.id);
    setName("");
    setEmoji("🏷️");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-accent">
            {current ? (
              <>
                <span aria-hidden>{current.emoji}</span>
                {current.name}
              </>
            ) : (
              <>
                <Tag className="h-3.5 w-3.5" />
                Definir categoria
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-2">
          <div className="scroll-thin max-h-56 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-1">
              {categories.map((c) => (
                <span key={c.id} className="inline-flex items-center">
                  <button
                    onClick={() => {
                      onChange(value === c.id ? null : c.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] hover:bg-accent",
                      value === c.id ? "border-primary bg-primary/10" : "border-border",
                    )}
                  >
                    <span aria-hidden>{c.emoji}</span>
                    {c.name}
                  </button>
                  {custom.some((x) => x.id === c.id) && (
                    <button
                      aria-label={`Excluir categoria ${c.name}`}
                      onClick={() => {
                        if (value === c.id) onChange(null);
                        removeCategory(c.id);
                      }}
                      className="ml-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">Nova categoria</p>
            <div className="flex items-center gap-1.5">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                aria-label="Emoji da categoria"
                className="w-10 rounded-md border border-border bg-background px-1.5 py-1 text-center text-xs"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="Nome"
                aria-label="Nome da categoria"
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
              />
              <button
                onClick={create}
                aria-label="Adicionar categoria"
                className="rounded-md border border-border p-1.5 hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {value && (
        <button
          aria-label="Remover categoria"
          onClick={() => onChange(null)}
          className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
