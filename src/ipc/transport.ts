import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { AppError, LoafEvent } from "./types";

type Handler = (cmd: string, args: Record<string, unknown> | undefined) => Promise<unknown>;
type Subscribe = (cb: (e: LoafEvent) => void) => () => void;

let mock: { call: Handler; subscribe: Subscribe } | null = null;

/** In `vite dev` outside Tauri the UI runs against an in-memory fake, so the screens can be
 *  designed and screenshotted without the Rust shell. It is dead code in production builds. */
async function loadMock() {
  if (!mock && import.meta.env.DEV) mock = (await import("./mock")).createMock();
  return mock;
}

export async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) return (await invoke<T>(cmd, args)) as T;
  const m = await loadMock();
  if (!m) throw new Error("Loaf's shell isn't available.");
  return (await m.call(cmd, args)) as T;
}

export function onEvent(cb: (e: LoafEvent) => void): () => void {
  if (isTauri()) {
    const pending = listen<LoafEvent>("loaf://event", (e) => cb(e.payload));
    return () => void pending.then((off) => off());
  }
  let off: (() => void) | undefined;
  let cancelled = false;
  void loadMock().then((m) => {
    if (m && !cancelled) off = m.subscribe(cb);
  });
  return () => {
    cancelled = true;
    off?.();
  };
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as AppError).message);
  return typeof e === "string" ? e : "Something went wrong. Your data is safe.";
}
