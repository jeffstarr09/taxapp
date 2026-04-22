import { WorkoutSession } from "@/types";
import { totalCalories } from "./calories";

export interface MonthlyChallenge {
  id: string;
  title: string;
  description: string;
  targetCalories: number;
  month: number;
  year: number;
  reward: {
    name: string;
    brand: string;
    imageUrl: string;
    value: string;
  };
}

export interface MonthlyChallengeProgress {
  currentCalories: number;
  targetCalories: number;
  percent: number;
  completed: boolean;
  daysLeft: number;
}

export function getCurrentMonthlyChallenge(): MonthlyChallenge {
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return {
    id: `${now.getFullYear()}-${now.getMonth()}`,
    title: `${monthNames[now.getMonth()]} Challenge`,
    description: `Burn 2,000 calories this month to earn a reward`,
    targetCalories: 2000,
    month: now.getMonth(),
    year: now.getFullYear(),
    reward: {
      name: "Grass-Fed Whey Protein Isolate",
      brand: "NOBULL",
      imageUrl: "https://nobullproject.com/cdn/shop/files/Whey_Protein_Powder_Chocolate_Front.png?v=1727986408&width=800",
      value: "$60",
    },
  };
}

export function getMonthlyChallengeProgress(
  challenge: MonthlyChallenge,
  workouts: WorkoutSession[]
): MonthlyChallengeProgress {
  const monthStart = new Date(challenge.year, challenge.month, 1);
  const monthEnd = new Date(challenge.year, challenge.month + 1, 0, 23, 59, 59);

  const monthWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    return d >= monthStart && d <= monthEnd;
  });

  const currentCalories = totalCalories(monthWorkouts);
  const percent = Math.min(100, Math.round((currentCalories / challenge.targetCalories) * 100));

  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    currentCalories,
    targetCalories: challenge.targetCalories,
    percent,
    completed: currentCalories >= challenge.targetCalories,
    daysLeft,
  };
}
