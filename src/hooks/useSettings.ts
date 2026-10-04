// useSettings hook (F0-07)
// Provides reactive access to settings from the store

import { useEffect, useState } from "react";
import { settingsStore } from "../stores/settingsStore";
import type { Settings, SettingsKey } from "../ipc";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        await settingsStore.hydrate();
        setSettings(settingsStore.getAll());
        setIsLoading(false);

        unsubscribe = settingsStore.subscribe(() => {
          setSettings(settingsStore.getAll());
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const setSetting = async <K extends SettingsKey>(key: K, value: Settings[K]): Promise<void> => {
    try {
      await settingsStore.set(key, value);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  };

  return {
    settings,
    isLoading,
    error,
    setSetting,
    get: <K extends SettingsKey>(key: K): Settings[K] | undefined => settingsStore.get(key),
  };
}
