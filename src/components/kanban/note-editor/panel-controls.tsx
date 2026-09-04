import { GripVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Peças visuais do painel de edição.
 *
 * Antes eram funções declaradas dentro do componente, recriadas a cada render
 * e impossíveis de reaproveitar entre as abas. Como componentes, cada uma tem
 * assinatura explícita e o painel fica só com a composição.
 */

/** Bloco de opções com título em caixa alta. */
export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

/** Item do catálogo de blocos: clicar insere, arrastar solta na posição. */
export function BlockRow({
  label,
  icon: Icon,
  enabled,
  onClick,
  onDragStart,
}: {
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  onClick: () => void;
  onDragStart?: (event: React.DragEvent) => void;
}) {
  return (
    <div
      draggable={enabled && !!onDragStart}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-[13px] transition-colors",
        enabled ? "cursor-grab hover:bg-accent active:cursor-grabbing" : "opacity-40",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
      <GripVertical className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
    </div>
  );
}

/**
 * Botão de formatação. O `onMouseDown` cancelado é essencial: sem ele o clique
 * tira o foco do editor e a seleção some antes do comando rodar.
 */
export function IconButton({
  label,
  icon: Icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center rounded-lg border border-border text-foreground/70 transition-colors hover:bg-accent disabled:opacity-40",
        active && "bg-accent text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/** Botão de estilo de texto (Título, Corpo, Legenda…). */
export function StyleButton({
  label,
  active,
  disabled = false,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2 py-2 text-[13px] font-semibold transition-colors disabled:opacity-40",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-foreground/80 hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}

/** Ação da nota (fixar, duplicar, excluir…). */
export function ActionRow({
  label,
  icon: Icon,
  danger = false,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors",
        danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", !danger && "text-muted-foreground")} />
      {label}
    </button>
  );
}
