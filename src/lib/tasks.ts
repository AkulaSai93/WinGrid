import type { Task } from "./types";
import { startOfDay } from "./utils";

export type TaskBucket = "overdue" | "today" | "upcoming" | "completed";

export function taskBucket(t: Task, now = Date.now()): TaskBucket {
  if (t.completedAt) return "completed";
  const due = new Date(t.dueAt).getTime();
  if (due < now) return "overdue";
  if (due < startOfDay(new Date(now)) + 86_400_000) return "today";
  return "upcoming";
}

export const BUCKET_LABEL: Record<TaskBucket, string> = {
  overdue: "Overdue",
  today: "Due today",
  upcoming: "Upcoming",
  completed: "Completed",
};
