import { useCallback, useEffect, useState } from "react";

export type UserProfile = {
  name: string;
  email: string;
  role: string;
  bio: string;
  company: string;
  location: string;
  plan: "free" | "pro" | "team";
};

export const defaultProfile: UserProfile = {
  name: "Walle Dev",
  email: "walle@stickyflow.app",
  role: "Product Designer",
  bio: "Organizando ideias em notas autoadesivas todos os dias.",
  company: "Sticky Flow",
  location: "São Paulo, BR",
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

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile({ ...defaultProfile, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { profile, update, hydrated };
}
