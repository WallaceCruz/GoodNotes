import { Archive, MessageSquare, Search, X } from "lucide-react";
import { useState } from "react";
import { type Note } from "@/lib/board/model";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/date";
import { stripHtml } from "@/lib/html";
import { DeadlineBadge } from "@/components/note/NoteMeta";

type Status = "all" | "active" | "archived";

const STATUS_LABEL: Record<Status, string> = {
  all: "Todas",
  active: "Ativas",
  archived: "Arquivadas",
};

export function InboxList({
  notes,
  activeId,
  onSelect,
}: {
  notes: Note[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");

  const q = query.trim().toLowerCase();
  const filtered = notes.filter((n) => {
    if (status === "active" && n.archived) return false;
    if (status === "archived" && !n.archived) return false;
    if (
      q &&
      !`${n.title} ${n.tags.join(" ")} ${stripHtml(n.content)} ${stripHtml(n.contentBelow ?? "")}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });

  const dirty = q !== "" || status !== "all";

  return (
    <section className="flex w-80 shrink-0 flex-col border-r border-border bg-background">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Inbox</h2>
        <span className="text-xs text-muted-foreground">{filtered.length}</span>
        <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                status === s
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou #tag"
            aria-label="Buscar notas no inbox"
            className="w-full bg-transparent text-xs outline-none"
          />
          {dirty && (
            <button
              aria-label="Limpar filtros do inbox"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma nota encontrada.</p>
        )}
        {filtered.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={cn(
              "block w-full border-b border-border px-4 py-3 text-left hover:bg-accent",
              activeId === n.id && "bg-accent",
            )}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{n.author}</span>
              {n.archived && <Archive className="h-3 w-3" />}
              <span className="ml-auto">{timeAgo(n.updatedAt)}</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-snug">{n.title}</p>
            {n.deadline && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <DeadlineBadge deadline={n.deadline} />
              </div>
            )}
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {stripHtml(n.content)}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
