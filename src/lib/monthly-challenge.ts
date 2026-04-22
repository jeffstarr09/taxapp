import { WorkoutSession } from "@/types";
import { totalCalories } from "./calories";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  metric: "calories";
  month: number;
  year: number;
  reward: {
    name: string;
    brand: string;
    imageUrl: string;
    value: string;
  };
}

export interface ChallengeProgress {
  currentCalories: number;
  daysLeft: number;
}

export function getActiveChallenges(): Challenge[] {
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthLabel = monthNames[now.getMonth()];

  return [
    {
      id: `${now.getFullYear()}-${now.getMonth()}-nobull`,
      title: `${monthLabel} Protein Challenge`,
      description: "Burn the most calories this month",
      metric: "calories",
      month: now.getMonth(),
      year: now.getFullYear(),
      reward: {
        name: "Grass-Fed Whey Protein Isolate",
        brand: "NOBULL",
        imageUrl: "/nobull.png",
        value: "$60",
      },
    },
    {
      id: `${now.getFullYear()}-${now.getMonth()}-on`,
      title: `${monthLabel} Sneaker Challenge`,
      description: "Burn the most calories this month",
      metric: "calories",
      month: now.getMonth(),
      year: now.getFullYear(),
      reward: {
        name: "Cloudnova 2 Ice / Zodiac",
        brand: "On",
        imageUrl: "/shoe.png",
        value: "$170",
      },
    },
    {
      id: `${now.getFullYear()}-${now.getMonth()}-ryze`,
      title: `${monthLabel} Coffee Challenge`,
      description: "Burn the most calories this month",
      metric: "calories",
      month: now.getMonth(),
      year: now.getFullYear(),
      reward: {
        name: "Mushroom Coffee (30 Servings)",
        brand: "RYZE",
        imageUrl: "/ryze.png",
        value: "$36",
      },
    },
  ];
}

export function getCurrentMonthlyChallenge(): Challenge {
  return getActiveChallenges()[0];
}

export interface MonthlyChallengeProgress {
  currentCalories: number;
  targetCalories: number;
  percent: number;
  completed: boolean;
  daysLeft: number;
}

export function getMonthlyChallengeProgress(
  challenge: Challenge,
  workouts: WorkoutSession[]
): MonthlyChallengeProgress {
  const monthStart = new Date(challenge.year, challenge.month, 1);
  const monthEnd = new Date(challenge.year, challenge.month + 1, 0, 23, 59, 59);

  const monthWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    return d >= monthStart && d <= monthEnd;
  });

  const currentCalories = totalCalories(monthWorkouts);
  const targetCalories = 2000;
  const percent = Math.min(100, Math.round((currentCalories / targetCalories) * 100));

  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    currentCalories,
    targetCalories,
    percent,
    completed: currentCalories >= targetCalories,
    daysLeft,
  };
}

export function getChallengeProgress(
  challenge: Challenge,
  workouts: WorkoutSession[]
): ChallengeProgress {
  const monthStart = new Date(challenge.year, challenge.month, 1);
  const monthEnd = new Date(challenge.year, challenge.month + 1, 0, 23, 59, 59);

  const monthWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    return d >= monthStart && d <= monthEnd;
  });

  const currentCalories = totalCalories(monthWorkouts);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return { currentCalories, daysLeft };
}
