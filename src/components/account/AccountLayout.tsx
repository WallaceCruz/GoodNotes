import { Link } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Settings, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/perfil", label: "Perfil", icon: User },
  { to: "/planos", label: "Planos", icon: CreditCard },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AccountLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao quadro
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <nav className="mt-6 flex gap-1 rounded-lg border border-border bg-background p-1">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent",
              )}
              activeProps={{ className: "bg-accent font-medium text-foreground" }}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 space-y-6">{children}</div>
      </main>
    </div>
  );
}
