import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { AccountLayout } from "@/components/account/AccountLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserProfile, type UserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

const plans: {
  id: UserProfile["plan"];
  name: string;
  price: string;
  note: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: "R$ 0",
    note: "para sempre",
    features: [
      "1 projeto e 3 arquivos",
      "Notas autoadesivas e bloco de notas",
      "Checklists e prazos",
      "Armazenamento local",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 29",
    note: "por mês",
    highlight: true,
    features: [
      "Projetos e arquivos ilimitados",
      "Automações por tag e prioridade",
      "Calendário com lembretes por horário",
      "Arquivamento e histórico",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "R$ 79",
    note: "por mês, por time",
    features: [
      "Tudo do Pro",
      "Responsáveis e colaboração",
      "Permissões por projeto",
      "Suporte prioritário",
    ],
  },
];

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos - Sticky Flow" },
      {
        name: "description",
        content:
          "Compare os planos Free, Pro e Team do Sticky Flow e escolha o ideal para o seu fluxo de notas.",
      },
      { property: "og:title", content: "Planos - Sticky Flow" },
      {
        property: "og:description",
        content: "Free, Pro e Team: escolha o plano do seu quadro de notas autoadesivas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const { profile, update } = useUserProfile();

  return (
    <AccountLayout title="Planos" description="Escolha o plano que acompanha o seu ritmo.">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const current = profile.plan === p.id;
          return (
            <section
              key={p.id}
              className={cn(
                "flex flex-col rounded-lg border border-border bg-background p-5",
                p.highlight && "border-primary shadow-sm",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide">{p.name}</h2>
                {current && <Badge variant="secondary">Atual</Badge>}
              </div>
              <p className="mt-3">
                <span className="text-2xl font-semibold">{p.price}</span>{" "}
                <span className="text-xs text-muted-foreground">{p.note}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5"
                variant={current ? "outline" : p.highlight ? "default" : "secondary"}
                disabled={current}
                onClick={() => {
                  update({ plan: p.id });
                  toast.success(`Plano ${p.name} selecionado`);
                }}
              >
                {current ? "Plano atual" : `Escolher ${p.name}`}
              </Button>
            </section>
          );
        })}
      </div>
    </AccountLayout>
  );
}
