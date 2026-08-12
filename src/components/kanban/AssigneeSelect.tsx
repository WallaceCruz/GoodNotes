import { Check, UserPlus } from "lucide-react";
import { MEMBERS, initials } from "@/lib/board-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function AssigneeSelect({
  value,
  onChange,
  size = "sm",
}: {
  value: string | null;
  onChange: (name: string | null) => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Atribuir responsável"
            className="flex items-center gap-1.5 rounded-full border border-foreground/15 bg-background/40 py-0.5 pl-0.5 pr-2 text-[11px] text-foreground/70 hover:bg-foreground/5"
          >
            {value ? (
              <span
                className={cn(
                  "flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
                  dim,
                )}
              >
                {initials(value)}
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
            <span className="max-w-24 truncate">{value ?? "Responsável"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={() => onChange(null)}>
            <UserPlus className="h-4 w-4" />
            Sem responsável
            {!value && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
          {MEMBERS.map((m) => (
            <DropdownMenuItem key={m.id} onClick={() => onChange(m.name)}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                {initials(m.name)}
              </span>
              {m.name}
              {value === m.name && <Check className="ml-auto h-3.5 w-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
