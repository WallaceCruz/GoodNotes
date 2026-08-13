import { useCallback, useEffect, useState } from "react";

export type NotificationSettings = {
  enabled: boolean;
  daysBefore: number;
  notifyOverdue: boolean;
  showToasts: boolean;
  onlyHighPriority: boolean;
  quietMode: boolean;
  timeReminders: boolean;
  minutesBefore: number;
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
};


const KEY = "sticky-flow:notifications";

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...defaultNotificationSettings, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    update(defaultNotificationSettings);
  }, [update]);

  return { settings, update, reset, hydrated };
}
