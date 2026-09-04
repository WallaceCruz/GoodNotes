import { useCallback } from "react";
import { useLocalStore } from "./useLocalStore";

export type NotificationSettings = {
  enabled: boolean;
  daysBefore: number;
  notifyOverdue: boolean;
  showToasts: boolean;
  onlyHighPriority: boolean;
  quietMode: boolean;
  timeReminders: boolean;
  minutesBefore: number;
  channelApp: boolean;
  channelEmail: boolean;
  emailAddress: string;
};

export const MINUTES_BEFORE_OPTIONS = [5, 10, 15, 30, 60, 120, 1440];

export const minutesBeforeLabel = (m: number) =>
  m >= 1440 ? "1 dia" : m >= 60 ? `${m / 60} h` : `${m} min`;

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  daysBefore: 3,
  notifyOverdue: true,
  showToasts: true,
  onlyHighPriority: false,
  quietMode: false,
  timeReminders: true,
  minutesBefore: 30,
  channelApp: true,
  channelEmail: false,
  emailAddress: "",
};

const KEY = "sticky-flow:notifications";

/** Preferências gravadas por versões antigas podem não ter todos os campos. */
function parseSettings(raw: unknown): NotificationSettings | null {
  if (!raw || typeof raw !== "object") return null;
  return { ...defaultNotificationSettings, ...(raw as Partial<NotificationSettings>) };
}

export function useNotificationSettings() {
  const {
    value: settings,
    setValue,
    hydrated,
  } = useLocalStore({
    key: KEY,
    fallback: defaultNotificationSettings,
    parse: parseSettings,
    label: "notificações",
  });

  const update = useCallback(
    (patch: Partial<NotificationSettings>) => setValue((current) => ({ ...current, ...patch })),
    [setValue],
  );

  const reset = useCallback(() => setValue(defaultNotificationSettings), [setValue]);

  return { settings, update, reset, hydrated };
}
