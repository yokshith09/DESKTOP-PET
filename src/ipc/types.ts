// Mirrors the serde shapes in loaf-core. Hand-written until ts-rs generation lands (F0-07).

export type NoteColor =
  | "default" | "red" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple" | "gray";
export const NOTE_COLORS: readonly NoteColor[] = [
  "default", "red", "orange", "yellow", "green", "teal", "blue", "purple", "gray",
];

export interface Label { id: string; name: string }
export interface LabelCount { label: Label; count: number }

export interface NoteSummary {
  id: string;
  title: string;
  excerpt: string;
  color: NoteColor;
  pinned: boolean;
  archived: boolean;
  created_at: number;
  edited_at: number;
  labels: Label[];
}
export interface Note extends Omit<NoteSummary, "excerpt"> { body: string }

export interface NoteInput { title?: string; body?: string; color?: NoteColor; label_ids?: string[] }
export interface NotePatch { title?: string; body?: string; color?: NoteColor; label_ids?: string[] }
export type NoteSort = "last_edited" | "created" | "color";

export type TaskStatus = "PLANNED" | "IN_PROGRESS" | "PENDING" | "COMPLETED" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskView = "today" | "upcoming" | "pending" | "all" | "completed";
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority | null;
  project: string | null;
  planned_date: string | null;
  due_date: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}
export interface TaskRow { task: Task; overdue: boolean }

export type ErrorCode =
  | "VALIDATION" | "NOT_FOUND" | "INVALID_TRANSITION" | "CONFLICT" | "DB" | "IO" | "INTERNAL";
export interface AppError { code: ErrorCode; message: string; field?: string }

/** One bus event as forwarded by the shell; only the tag matters to the UI. */
export interface LoafEvent { type: string; at: number; [field: string]: unknown }

export interface BinNote extends NoteSummary { deleted_at: number }

export interface Reminder {
  id: string;
  title: string;
  remind_at: number;
  note_id: string | null;
  fired_at: number | null;
  done_at: number | null;
  created_at: number;
}
export interface ReminderInput { title: string; remind_at: number; note_id?: string | null }
export interface ReminderPatch { title?: string; remind_at?: number }
