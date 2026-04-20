import { WorkoutSession } from "@/types";

export interface StreakInfo {
  count: number;
  workedOutToday: boolean;
  isAtRisk: boolean;
}

export function computeStreak(workouts: WorkoutSession[]): StreakInfo {
  if (workouts.length === 0) {
    return { count: 0, workedOutToday: false, isAtRisk: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workoutDates = new Set(
    workouts.map((w) => {
      const d = new Date(w.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const workedOutToday = workoutDates.has(today.getTime());

  let streak = 0;
  const day = new Date(today);
  if (!workedOutToday) day.setDate(day.getDate() - 1);
  while (workoutDates.has(day.getTime())) {
    streak++;
    day.setDate(day.getDate() - 1);
  }

  // At risk: had a streak yesterday but hasn't worked out yet today
  const isAtRisk = !workedOutToday && streak > 0;

  return { count: streak, workedOutToday, isAtRisk };
}

export function streakMessage(info: StreakInfo): string {
  if (info.isAtRisk) return "Don't break it — work out today!";
  if (info.count > 0 && info.workedOutToday) return "Keep it going!";
  if (info.count === 0 && info.workedOutToday) return "Day 1 — come back tomorrow!";
  return "Start your streak today!";
}
