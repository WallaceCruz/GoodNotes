import { useCallback } from "react";
import { useLocalStore } from "./useLocalStore";
import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Informe pelo menos 2 caracteres" })
    .max(60, { message: "Máximo de 60 caracteres" }),
  email: z
    .string()
    .trim()
    .email({ message: "E-mail inválido" })
    .max(255, { message: "Máximo de 255 caracteres" }),
  role: z.string().trim().max(60, { message: "Máximo de 60 caracteres" }),
  bio: z.string().trim().max(300, { message: "Máximo de 300 caracteres" }),
  company: z.string().trim().max(60, { message: "Máximo de 60 caracteres" }),
  location: z.string().trim().max(60, { message: "Máximo de 60 caracteres" }),
});

export type ProfileField = keyof z.infer<typeof profileSchema>;

export type UserProfile = z.infer<typeof profileSchema> & {
  avatar: string | null;
  plan: "free" | "pro" | "team";
};

export const defaultProfile: UserProfile = {
  name: "Walle Dev",
  email: "walle@stickyflow.app",
  role: "Product Designer",
  bio: "Organizando ideias em notas autoadesivas todos os dias.",
  company: "Goodnotes",
  location: "São Paulo, BR",
  avatar: null,
  plan: "free",
};

const KEY = "sticky-flow:profile";

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function validateField(field: ProfileField, value: string): string | null {
  const result = profileSchema.shape[field].safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? "Valor inválido");
}

/** Campos ausentes (perfil gravado antes de um campo existir) caem no padrão. */
function parseProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== "object") return null;
  return { ...defaultProfile, ...(raw as Partial<UserProfile>) };
}

export function useUserProfile() {
  const {
    value: profile,
    setValue,
    hydrated,
  } = useLocalStore({
    key: KEY,
    fallback: defaultProfile,
    parse: parseProfile,
    label: "perfil",
  });

  const update = useCallback(
    (patch: Partial<UserProfile>) => setValue((current) => ({ ...current, ...patch })),
    [setValue],
  );

  return { profile, update, hydrated };
}
