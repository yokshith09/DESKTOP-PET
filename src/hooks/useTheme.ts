import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ipc } from "@/ipc";
import { keys, useSettings } from "./useLoaf";

/** Applies `general.theme` ("light" | "dark" | "system") as the `dark` class on <html>. */
export function useTheme() {
  const qc = useQueryClient();
  const { data } = useSettings();
  const pref = data?.["general.theme"] ?? "dark";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle("dark", pref === "dark" || (pref === "system" && mq.matches));
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [pref]);

  const isDark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return {
    isDark,
    toggle: async () => {
      await ipc.settingSet("general.theme", isDark ? "light" : "dark");
      await qc.invalidateQueries({ queryKey: keys.settings });
    },
  };
}
