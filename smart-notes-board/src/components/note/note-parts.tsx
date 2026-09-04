import { checklistProgress } from "@/lib/board/checklist";
import { type ChecklistItem, type Column, type Note, type TagDef } from "@/lib/board/model";
import { effectiveStatus } from "@/lib/board/status";
import { tagColorOf } from "@/lib/board/tags";
import { initials } from "@/lib/text";
import { cn } from "@/lib/utils";
import { noteBg } from "@/components/note/note-style";
import { CategoryBadge } from "@/components/note/CategorySelect";
import { DeadlineBadge, PriorityBadge } from "@/components/note/NoteMeta";
import { StatusBadge } from "@/components/note/StatusSelect";

/**
 * Partes que toda representação de nota desenha igual.
 *
 * Três superfícies mostram a mesma nota — o card do quadro, a prévia que segue
 * o cursor no arraste e a carta do deck no celular. Cada uma repetia a linha de
 * selos, a pilha de responsáveis, as etiquetas e a barra do checklist, então
 * acrescentar um selo exigia lembrar de três arquivos. Aqui elas são um lugar
 * só; o que muda de superfície para superfície é a escala, que vem por prop.
 */

/** Selos de contexto da nota: em que etapa está, categoria, prioridade e prazo. */
export function NoteBadges({
  note,
  columns,
  className,
}: {
  note: Note;
  columns: Column[];
  className?: string;
}) {
  const status = effectiveStatus(note, columns);
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {status && <StatusBadge status={status} />}
      {note.category && <CategoryBadge category={note.category} />}
      {note.priority && <PriorityBadge priority={note.priority} />}
      {note.deadline && <DeadlineBadge deadline={note.deadline} />}
    </div>
  );
}

/** Responsáveis como avatares sobrepostos, do jeito que cabe num canto de card. */
export function AssigneeStack({
  names,
  size = "sm",
  max = 4,
}: {
  names: string[];
  size?: "sm" | "md";
  max?: number;
}) {
  if (names.length === 0) return null;
  const dimension = size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";

  return (
    <div className="flex items-center">
      {names.slice(0, max).map((name, index) => (
        <span
          key={name}
          title={name}
          className={cn(
            "flex items-center justify-center rounded-full border border-background bg-primary font-semibold text-primary-foreground",
            dimension,
            index > 0 && "-ml-2",
          )}
        >
          {initials(name)}
        </span>
      ))}
      {names.length > max && (
        <span
          className={cn(
            "-ml-2 flex items-center justify-center rounded-full border border-background bg-muted font-semibold text-foreground/70",
            dimension,
          )}
        >
          +{names.length - max}
        </span>
      )}
    </div>
  );
}

/** Etiquetas da nota, apenas para leitura (editar é papel do `TagEditor`). */
export function TagChips({
  tags,
  tagDefs = [],
  max,
  className,
}: {
  tags: string[];
  /** Definições do arquivo, de onde vem a cor de cada etiqueta. */
  tagDefs?: TagDef[];
  max?: number;
  className?: string;
}) {
  if (tags.length === 0) return null;
  const shown = max ? tags.slice(0, max) : tags;

  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}>
      {shown.map((tag) => (
        <span
          key={tag}
          className={cn(
            "rounded-full border border-foreground/10 px-2 py-0.5 text-[10px] text-foreground/80",
            noteBg[tagColorOf(tagDefs, tag)],
          )}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}

/** Quanto do checklist está feito, em número e em barra. */
export function ChecklistBar({ items, className }: { items: ChecklistItem[]; className?: string }) {
  const { done, total, percent } = checklistProgress(items);
  if (total === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-foreground/60">
        <span>Checklist</span>
        <span>
          {done}/{total} · {percent}%
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
