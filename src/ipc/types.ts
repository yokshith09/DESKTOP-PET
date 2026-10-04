// Wire types come from Rust (ts-rs): run `pnpm gen:types` after changing a type in loaf-core.
import type { NoteColor, NoteInput as GeneratedNoteInput, NotePatch as GeneratedNotePatch, ReminderInput as GeneratedReminderInput, ReminderPatch as GeneratedReminderPatch } from "./generated";

export type {
  AppError, BinNote, DailyLog, ErrorCode, Label, LogEntry, LabelCount, Note, NoteColor, NoteSort, NoteSummary, Priority,
  Reminder, Snapshot, Stats, Task, TaskRow, TaskStatus, TaskView,
} from "./generated";

export const NOTE_COLORS: readonly NoteColor[] = [
  "default", "red", "orange", "yellow", "green", "teal", "blue", "purple", "gray",
];

// The core fills missing fields with defaults, so callers may send only what they set.
export type NoteInput = Partial<GeneratedNoteInput>;
export type NotePatch = Partial<GeneratedNotePatch>;
export type ReminderInput = GeneratedReminderInput;
export type ReminderPatch = Partial<GeneratedReminderPatch>;

/** One bus event as forwarded by the shell; only the tag matters to the UI. */
export interface LoafEvent { type: string; at: number; [field: string]: unknown }

// Time tracking (Phase 2 data, opt-in). Replace with the generated types once `pnpm gen:types` has them.
export interface TimeRange { started_at: number; ended_at: number }
export interface AppUsage { app: string; category: string; is_browser: boolean; total_seconds: number; sessions: number }
export interface DomainUsage { domain: string; browser: string; category: string; total_seconds: number; sessions: number }
export interface UsageSummary { total_seconds: number; apps: AppUsage[]; domains: DomainUsage[]; hourly_seconds: number[] }
export interface TrackingStatus { supported: boolean; running: boolean; enabled: boolean }
export interface Shortcut { id: string; url: string; label: string }
