import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage, ipc, type Shortcut } from "@/ipc";
import { parseLinks } from "@/lib/links";

const KEY = ["prefs", "ui.shortcuts"] as const;

/** Pasted links, kept in preferences and opened in the default browser. */
export function useShortcuts() {
  const qc = useQueryClient();
  const { data: shortcuts = [] } = useQuery({ queryKey: KEY, queryFn: async () => (await ipc.prefsGet<Shortcut[]>("ui.shortcuts")) ?? [] });
  const save = async (next: Shortcut[]) => {
    qc.setQueryData(KEY, next);
    await ipc.prefsSet("ui.shortcuts", next);
  };
  return {
    shortcuts,
    /** Add every link found in `text`. Returns how many were new. */
    add: async (text: string, name?: string) => {
      const found = parseLinks(text).filter((f) => !shortcuts.some((s) => s.url === f.url));
      if (found.length === 0) return 0;
      const made = found.map((f, i) => ({ id: `${Date.now()}-${i}`, url: f.url, label: found.length === 1 && name?.trim() ? name.trim() : f.label }));
      await save([...shortcuts, ...made].slice(0, 24));
      return made.length;
    },
    remove: (id: string) => save(shortcuts.filter((s) => s.id !== id)),
    open: async (url: string) => {
      try {
        await ipc.openUrl(url);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
  };
}
