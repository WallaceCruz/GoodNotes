import { useCallback, useEffect, useState } from "react";
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
  company: "Sticky Flow",
  location: "São Paulo, BR",
  avatar: null,
  plan: "free",
};

const KEY = "sticky-flow:profile";
const EVENT = "sticky-flow:profile-change";

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

function read(): UserProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultProfile;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(read());
    setHydrated(true);
    const sync = () => setProfile(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(EVENT));
      return next;
    });
  }, []);

  return { profile, update, hydrated };
}
