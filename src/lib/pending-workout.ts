import { ExerciseType } from "@/types";

const KEY = "drop_pending_workout";

export interface PendingWorkout {
  count: number;
  duration: number;
  avgForm: number;
  timestamps: number[];
  exerciseType: ExerciseType;
  date: string;
}

export function storePendingWorkout(workout: PendingWorkout): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(workout));
  } catch {
    // sessionStorage unavailable (private mode edge case)
  }
}

export function getPendingWorkout(): PendingWorkout | null {
  if (typeof window === "undefined") return null;
  try {
    const item = sessionStorage.getItem(KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function clearPendingWorkout(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
