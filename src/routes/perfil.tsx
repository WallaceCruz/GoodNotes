import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AccountLayout } from "@/components/account/AccountLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initials, useUserProfile } from "@/hooks/useUserProfile";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil - Sticky Flow" },
      {
        name: "description",
        content: "Edite seu nome, e-mail, cargo e informações da conta no Sticky Flow.",
      },
      { property: "og:title", content: "Perfil - Sticky Flow" },
      {
        property: "og:description",
        content: "Gerencie os dados da sua conta no Sticky Flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { profile, update } = useUserProfile();

  return (
    <AccountLayout title="Perfil" description="Suas informações pessoais e da conta.">
      <section className="rounded-lg border border-border bg-background p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
              {initials(profile.name) || "SF"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-semibold">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Cargo</Label>
            <Input
              id="role"
              value={profile.role}
              onChange={(e) => update({ role: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              value={profile.company}
              onChange={(e) => update({ company: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => update({ location: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              value={profile.bio}
              onChange={(e) => update({ bio: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => toast.success("Perfil salvo")}>Salvar alterações</Button>
        </div>
      </section>
    </AccountLayout>
  );
}
