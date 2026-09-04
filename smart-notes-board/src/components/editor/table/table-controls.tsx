import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Clicar num controle não pode tirar o foco do editor: sem isso a seleção sai da
 * célula e o comando seguinte não teria mais tabela onde agir.
 */
function keepEditorSelection(action: () => void) {
  return {
    onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      action();
    },
  };
}

/** Botão compacto da barra flutuante, identificado só pelo ícone. */
export function ToolbarButton({
  label,
  icon: Icon,
  active = false,
  onSelect,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...keepEditorSelection(onSelect)}
      className={cn(
        "rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/** Linha do menu suspenso, com ícone e rótulo. */
export function MenuItem({
  label,
  icon: Icon,
  danger = false,
  disabled = false,
  onSelect,
}: {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      {...keepEditorSelection(onSelect)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
        "disabled:pointer-events-none disabled:opacity-40",
        danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", danger ? "" : "text-muted-foreground")} />
      {label}
    </button>
  );
}

export function MenuGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
