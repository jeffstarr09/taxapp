import { LeaderboardPeriod } from "@/types";

// Boundaries are computed in the user's local timezone so "this week"
// feels natural (Monday morning = fresh contest).

export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ISO week: Monday is day 1. JS getDay() returns 0=Sun..6=Sat.
export function startOfWeek(now: Date = new Date()): Date {
  const d = startOfToday(now);
  const day = d.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysSinceMonday);
  return d;
}

export function startOfMonth(now: Date = new Date()): Date {
  const d = startOfToday(now);
  d.setDate(1);
  return d;
}

export function periodStart(period: LeaderboardPeriod, now: Date = new Date()): Date | null {
  switch (period) {
    case "today":
      return startOfToday(now);
    case "week":
      return startOfWeek(now);
    case "month":
      return startOfMonth(now);
    case "all":
      return null;
  }
}

export function periodLabel(period: LeaderboardPeriod): string {
  switch (period) {
    case "today":
      return "Today";
    case "week":
      return "This Week";
    case "month":
      return "This Month";
    case "all":
      return "All Time";
  }
}

// Milliseconds until next Monday 00:00 local.
export function msUntilNextWeek(now: Date = new Date()): number {
  const nextMonday = startOfWeek(now);
  nextMonday.setDate(nextMonday.getDate() + 7);
  return nextMonday.getTime() - now.getTime();
}

// Formats a ms duration as "Xd Yh", "Yh Zm", or "Zm Ws" depending on size.
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
