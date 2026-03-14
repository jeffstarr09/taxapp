import { WorkoutSession } from "@/types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (workouts: WorkoutSession[]) => boolean;
  tier: "bronze" | "silver" | "gold" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Rep milestones
  {
    id: "first-drop",
    name: "First Drop",
    description: "Complete your first workout",
    icon: "💧",
    tier: "bronze",
    condition: (w) => w.length >= 1,
  },
  {
    id: "century",
    name: "Century Club",
    description: "100 total push-ups",
    icon: "💯",
    tier: "bronze",
    condition: (w) => w.reduce((s, x) => s + x.count, 0) >= 100,
  },
  {
    id: "five-hundred",
    name: "Half K",
    description: "500 total push-ups",
    icon: "🔥",
    tier: "silver",
    condition: (w) => w.reduce((s, x) => s + x.count, 0) >= 500,
  },
  {
    id: "thousand",
    name: "1K Club",
    description: "1,000 total push-ups",
    icon: "⚡",
    tier: "gold",
    condition: (w) => w.reduce((s, x) => s + x.count, 0) >= 1000,
  },
  {
    id: "five-thousand",
    name: "Iron Body",
    description: "5,000 total push-ups",
    icon: "🏆",
    tier: "legendary",
    condition: (w) => w.reduce((s, x) => s + x.count, 0) >= 5000,
  },

  // Single session
  {
    id: "twenty-set",
    name: "Warm Up",
    description: "20 push-ups in one session",
    icon: "🌡️",
    tier: "bronze",
    condition: (w) => w.some((x) => x.count >= 20),
  },
  {
    id: "fifty-set",
    name: "Half Century",
    description: "50 push-ups in one session",
    icon: "💪",
    tier: "silver",
    condition: (w) => w.some((x) => x.count >= 50),
  },
  {
    id: "hundred-set",
    name: "Beast Mode",
    description: "100 push-ups in one session",
    icon: "🦍",
    tier: "gold",
    condition: (w) => w.some((x) => x.count >= 100),
  },

  // Form
  {
    id: "perfect-form",
    name: "Textbook",
    description: "Score 95%+ form in a session",
    icon: "📐",
    tier: "silver",
    condition: (w) => w.some((x) => x.averageFormScore >= 95 && x.count >= 5),
  },
  {
    id: "consistent-form",
    name: "Discipline",
    description: "Score 80%+ form in 10 sessions",
    icon: "🎯",
    tier: "gold",
    condition: (w) =>
      w.filter((x) => x.averageFormScore >= 80 && x.count >= 5).length >= 10,
  },

  // Streaks
  {
    id: "three-day",
    name: "Momentum",
    description: "3-day workout streak",
    icon: "📈",
    tier: "bronze",
    condition: (w) => getStreak(w) >= 3,
  },
  {
    id: "seven-day",
    name: "Week Warrior",
    description: "7-day workout streak",
    icon: "🗓️",
    tier: "silver",
    condition: (w) => getStreak(w) >= 7,
  },
  {
    id: "thirty-day",
    name: "Unstoppable",
    description: "30-day workout streak",
    icon: "👑",
    tier: "legendary",
    condition: (w) => getStreak(w) >= 30,
  },

  // Session count
  {
    id: "five-sessions",
    name: "Getting Started",
    description: "Complete 5 workouts",
    icon: "🚀",
    tier: "bronze",
    condition: (w) => w.length >= 5,
  },
  {
    id: "twenty-five-sessions",
    name: "Regular",
    description: "Complete 25 workouts",
    icon: "⭐",
    tier: "silver",
    condition: (w) => w.length >= 25,
  },
  {
    id: "hundred-sessions",
    name: "Devoted",
    description: "Complete 100 workouts",
    icon: "💎",
    tier: "legendary",
    condition: (w) => w.length >= 100,
  },

  // Speed
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "25+ reps per minute (10+ reps)",
    icon: "⚡",
    tier: "gold",
    condition: (w) =>
      w.some((x) => x.count >= 10 && (x.count / x.duration) * 60 >= 25),
  },
];

function getStreak(workouts: WorkoutSession[]): number {
  const dates = Array.from(
    new Set(workouts.map((w) => w.date.split("T")[0]))
  )
    .sort()
    .reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];
    if (dates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

const SEEN_ACHIEVEMENTS_KEY = "pushup_seen_achievements";

function getSeenAchievements(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEEN_ACHIEVEMENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function markAchievementSeen(id: string): void {
  if (typeof window === "undefined") return;
  const seen = getSeenAchievements();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(SEEN_ACHIEVEMENTS_KEY, JSON.stringify(seen));
  }
}

export function getUnlockedAchievements(
  workouts: WorkoutSession[]
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.condition(workouts));
}

export function getNewAchievements(
  workouts: WorkoutSession[]
): Achievement[] {
  const seen = getSeenAchievements();
  const unlocked = getUnlockedAchievements(workouts);
  return unlocked.filter((a) => !seen.includes(a.id));
}

export function dismissAchievement(id: string): void {
  markAchievementSeen(id);
}

export function dismissAllAchievements(workouts: WorkoutSession[]): void {
  const unlocked = getUnlockedAchievements(workouts);
  unlocked.forEach((a) => markAchievementSeen(a.id));
}

export function getTierColor(tier: Achievement["tier"]): string {
  switch (tier) {
    case "bronze":
      return "from-amber-900/30 to-amber-800/10 border-amber-700/30";
    case "silver":
      return "from-neutral-500/30 to-neutral-600/10 border-neutral-400/30";
    case "gold":
      return "from-yellow-600/30 to-yellow-700/10 border-yellow-500/30";
    case "legendary":
      return "from-purple-600/30 to-purple-800/10 border-purple-500/30";
  }
}

export function getTierTextColor(tier: Achievement["tier"]): string {
  switch (tier) {
    case "bronze":
      return "text-amber-400";
    case "silver":
      return "text-neutral-300";
    case "gold":
      return "text-yellow-400";
    case "legendary":
      return "text-purple-400";
  }
}
