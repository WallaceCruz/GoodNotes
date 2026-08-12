import { CircleHelp, CreditCard, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const CURRENT_USER = { name: "Walle Dev", email: "walle@stickyflow.app" };

const items = [
  { label: "Perfil", icon: User },
  { label: "Planos", icon: CreditCard },
  { label: "Configurações", icon: Settings },
  { label: "Ajuda", icon: CircleHelp },
];

export function UserMenu({
  variant = "compact",
  className,
}: {
  variant?: "compact" | "full";
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Menu do usuário"
          className={cn(
            "flex items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-accent",
            className,
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
              WD
            </AvatarFallback>
          </Avatar>
          {variant === "full" && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{CURRENT_USER.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {CURRENT_USER.email}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="leading-tight">
          {CURRENT_USER.name}
          <span className="block text-[11px] font-normal text-muted-foreground">
            {CURRENT_USER.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((i) => (
          <DropdownMenuItem key={i.label} onClick={() => toast(`${i.label} em breve`)}>
            <i.icon className="h-4 w-4" />
            {i.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast("Sessão encerrada")}>
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
