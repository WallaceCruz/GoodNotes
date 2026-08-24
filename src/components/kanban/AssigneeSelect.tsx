import { Check, UserPlus, Plus } from "lucide-react";
import { MEMBERS, initials } from "@/lib/board-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Seletor multi de responsáveis: exibe apenas a pilha de avatares (sem nomes). */
export function AssigneeSelect({
  value,
  onChange,
  size = "sm",
  variant = "stack",
}: {
  value: string[];
  onChange: (names: string[]) => void;
  size?: "sm" | "md";
  /**
   * "stack" — pilha compacta de avatares (rodapé dos cards).
   * "cta" — pilha + botão "Adicionar responsáveis" (painel de edição).
   */
  variant?: "stack" | "cta";
}) {
  const dim = size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";
  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "cta" ? (
            <button
              aria-label="Atribuir responsáveis"
              title={value.length ? value.join(", ") : "Adicionar responsáveis"}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-foreground/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span className="flex items-center">
                {value.length ? (
                  value.slice(0, 4).map((name, i) => (
                    <span
                      key={name}
                      className={cn(
                        "flex items-center justify-center rounded-full border border-background bg-primary font-semibold text-primary-foreground",
                        dim,
                        i > 0 && "-ml-2",
                      )}
                    >
                      {initials(name)}
                    </span>
                  ))
                ) : (
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full border border-dashed border-foreground/30 text-foreground/60",
                      dim,
                    )}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </span>
                )}
              </span>
              <span className="font-medium">
                {value.length ? `${value.length} responsável${value.length > 1 ? "is" : ""}` : "Adicionar responsáveis"}
              </span>
              <Plus className="ml-auto h-3.5 w-3.5 text-foreground/50" />
            </button>
          ) : (
            <button
              aria-label="Atribuir responsáveis"
              title={value.length ? value.join(", ") : "Responsáveis"}
              className="flex items-center rounded-full border border-foreground/15 bg-background/40 p-0.5 hover:bg-foreground/5"
            >
              {value.length ? (
                <span className="flex items-center">
                  {value.slice(0, 4).map((name, i) => (
                    <span
                      key={name}
                      className={cn(
                        "flex items-center justify-center rounded-full border border-background bg-primary font-semibold text-primary-foreground",
                        dim,
                        i > 0 && "-ml-2",
                      )}
                    >
                      {initials(name)}
                    </span>
                  ))}
                  {value.length > 4 && (
                    <span
                      className={cn(
                        "-ml-2 flex items-center justify-center rounded-full border border-background bg-muted font-semibold text-foreground/70",
                        dim,
                      )}
                    >
                      +{value.length - 4}
                    </span>
                  )}
                  <span
                    className={cn(
                      "-ml-1.5 flex items-center justify-center rounded-full border border-dashed border-foreground/40 text-foreground/60",
                      dim,
                    )}
                  >
                    <Plus className="h-3 w-3" />
                  </span>
                </span>
              ) : (
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full border border-dashed border-foreground/30",
                    dim,
                  )}
                >
                  <UserPlus className="h-3 w-3" />
                </span>
              )}
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={() => onChange([])}>
            <UserPlus className="h-4 w-4" />
            Sem responsável
            {value.length === 0 && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
          {MEMBERS.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onSelect={(e) => {
                e.preventDefault();
                toggle(m.name);
              }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                {initials(m.name)}
              </span>
              {m.name}
              {value.includes(m.name) && <Check className="ml-auto h-3.5 w-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
