import { Check } from "lucide-react";
import { PRIORITIES, PRIORITY_ICON, PRIORITY_LABEL, type Priority } from "@/lib/board/model";
import { cn } from "@/lib/utils";
import { priorityClass } from "@/components/note/note-style";

/**
 * Prioridade como chip.
 *
 * A mesma lista estava escrita à mão em quatro telas (menu da nota, painel de
 * edição, tela do celular e filtros), cada uma com um arredondamento e um
 * tamanho de toque diferentes. O que muda entre elas é só a escala e se a
 * seleção é única ou múltipla — não a aparência do chip.
 */
export function PriorityChip({
  priority,
  active,
  onClick,
  size = "md",
}: {
  priority: Priority;
  active: boolean;
  onClick: () => void;
  /** `lg` existe para o celular, onde o alvo precisa caber o polegar. */
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border transition-colors",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-xs",
        active
          ? priorityClass[priority]
          : "border-border bg-background text-muted-foreground hover:bg-accent",
      )}
    >
      {PRIORITY_ICON[priority]} {PRIORITY_LABEL[priority]}
    </button>
  );
}

/**
 * Escolha de prioridade da nota. Clicar na opção já marcada limpa o campo —
 * é como o usuário desfaz sem precisar de um botão "nenhuma".
 */
export function PrioritySelect({
  value,
  onChange,
  size = "md",
  variant = "chips",
}: {
  value: Priority | null;
  onChange: (priority: Priority | null) => void;
  size?: "sm" | "md" | "lg";
  /** `menu` desenha linhas empilhadas, para dentro de um menu suspenso. */
  variant?: "chips" | "menu";
}) {
  const toggle = (priority: Priority) => onChange(value === priority ? null : priority);

  if (variant === "menu") {
    return (
      <div className="flex flex-col gap-1">
        {PRIORITIES.map((priority) => (
          <button
            key={priority}
            type="button"
            onClick={() => toggle(priority)}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
              value === priority ? priorityClass[priority] : "hover:bg-accent",
            )}
          >
            {PRIORITY_ICON[priority]} {PRIORITY_LABEL[priority]}
            {value === priority && <Check className="ml-auto h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {PRIORITIES.map((priority) => (
        <PriorityChip
          key={priority}
          priority={priority}
          active={value === priority}
          size={size}
          onClick={() => toggle(priority)}
        />
      ))}
    </div>
  );
}
