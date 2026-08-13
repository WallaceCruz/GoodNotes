import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AccountLayout } from "@/components/account/AccountLayout";
import { AvatarCropDialog } from "@/components/account/AvatarCropDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  initials,
  useUserProfile,
  validateField,
  type ProfileField,
} from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil - Sticky Flow" },
      {
        name: "description",
        content: "Edite seu nome, e-mail, cargo, foto e informações da conta no Sticky Flow.",
      },
      { property: "og:title", content: "Perfil - Sticky Flow" },
      {
        property: "og:description",
        content: "Gerencie os dados e a foto da sua conta no Sticky Flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const fields: {
  key: ProfileField;
  label: string;
  type?: string;
  full?: boolean;
  textarea?: boolean;
}[] = [
  { key: "name", label: "Nome" },
  { key: "email", label: "E-mail", type: "email" },
  { key: "role", label: "Cargo" },
  { key: "company", label: "Empresa" },
  { key: "location", label: "Localização", full: true },
  { key: "bio", label: "Bio", full: true, textarea: true },
];

function PerfilPage() {
  const { profile, update, hydrated } = useUserProfile();
  const [draft, setDraft] = useState<Record<ProfileField, string>>({
    name: "",
    email: "",
    role: "",
    company: "",
    location: "",
    bio: "",
  });
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!hydrated) return;
    setDraft({
      name: profile.name,
      email: profile.email,
      role: profile.role,
      company: profile.company,
      location: profile.location,
      bio: profile.bio,
    });
    // hidrata apenas uma vez, depois o campo é controlado localmente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const onChange = (key: ProfileField, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    const error = validateField(key, value);
    setErrors((e) => ({ ...e, [key]: error ?? undefined }));

    clearTimeout(timers.current[key]);
    if (error) {
      setStatus("idle");
      return;
    }
    setStatus("saving");
    timers.current[key] = setTimeout(() => {
      update({ [key]: value.trim() });
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    }, 600);
  };

  const onAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("A imagem deve ter no máximo 2 MB");
      return;
    }
    setCropFile(file);
  };

  return (
    <AccountLayout title="Perfil" description="Suas informações pessoais e da conta.">
      <section className="rounded-lg border border-border bg-background p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-20 w-20">
            {profile.avatar && <AvatarImage src={profile.avatar} alt={`Foto de ${profile.name}`} />}
            <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
              {initials(draft.name || profile.name) || "SF"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-base font-semibold">{draft.name || profile.name}</p>
            <p className="text-sm text-muted-foreground">{draft.email || profile.email}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Alterar foto
              </Button>
              {profile.avatar && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    update({ avatar: null });
                    toast("Foto removida");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">PNG ou JPG, até 2 MB.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onAvatar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <span
            className={cn(
              "ml-auto flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity",
              status === "idle" && "opacity-0",
            )}
          >
            {status === "saving" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
            {status === "saving" ? "Salvando..." : "Salvo automaticamente"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={cn("space-y-1.5", f.full && "sm:col-span-2")}>
              <Label htmlFor={f.key}>{f.label}</Label>
              {f.textarea ? (
                <Textarea
                  id={f.key}
                  rows={3}
                  maxLength={300}
                  value={draft[f.key]}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]}
                />
              ) : (
                <Input
                  id={f.key}
                  type={f.type ?? "text"}
                  maxLength={255}
                  value={draft[f.key]}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]}
                />
              )}
              {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
            </div>
          ))}
        </div>
      </section>
    </AccountLayout>
  );
}
