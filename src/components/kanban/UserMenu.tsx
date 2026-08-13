import { Link } from "@tanstack/react-router";
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
import { initials, useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

const links = [
  { label: "Perfil", icon: User, to: "/perfil" },
  { label: "Planos", icon: CreditCard, to: "/planos" },
  { label: "Configurações", icon: Settings, to: "/configuracoes" },
] as const;

export function UserMenu({
  variant = "compact",
  className,
}: {
  variant?: "compact" | "full";
  className?: string;
}) {
  const { profile } = useUserProfile();
  const CURRENT_USER = profile;
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
              {initials(profile.name) || "SF"}
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
        {links.map((i) => (
          <DropdownMenuItem key={i.label} asChild>
            <Link to={i.to}>
              <i.icon className="h-4 w-4" />
              {i.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => toast("Ajuda em breve")}>
          <CircleHelp className="h-4 w-4" />
          Ajuda
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast("Sessão encerrada")}>
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
