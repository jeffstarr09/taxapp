import { WorkoutSession } from "@/types";

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  unit: string;
  check: (todaysWorkouts: WorkoutSession[]) => number; // returns progress
}

// Deterministic daily challenge based on date
function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

const CHALLENGE_POOL: DailyChallenge[] = [
  {
    id: "rep-30",
    title: "Thirty Drop",
    description: "Do 30 push-ups today",
    target: 30,
    unit: "reps",
    check: (w) => w.reduce((s, x) => s + x.count, 0),
  },
  {
    id: "rep-50",
    title: "Half Century",
    description: "Do 50 push-ups today",
    target: 50,
    unit: "reps",
    check: (w) => w.reduce((s, x) => s + x.count, 0),
  },
  {
    id: "rep-75",
    title: "75 Club",
    description: "Do 75 push-ups today",
    target: 75,
    unit: "reps",
    check: (w) => w.reduce((s, x) => s + x.count, 0),
  },
  {
    id: "rep-100",
    title: "Century Push",
    description: "Do 100 push-ups today",
    target: 100,
    unit: "reps",
    check: (w) => w.reduce((s, x) => s + x.count, 0),
  },
  {
    id: "sessions-2",
    title: "Double Down",
    description: "Complete 2 workouts today",
    target: 2,
    unit: "sessions",
    check: (w) => w.length,
  },
  {
    id: "sessions-3",
    title: "Triple Threat",
    description: "Complete 3 workouts today",
    target: 3,
    unit: "sessions",
    check: (w) => w.length,
  },
  {
    id: "form-85",
    title: "Form Check",
    description: "Score 85%+ form in a session (10+ reps)",
    target: 1,
    unit: "sessions",
    check: (w) =>
      w.filter((x) => x.averageFormScore >= 85 && x.count >= 10).length,
  },
  {
    id: "form-90",
    title: "Perfect Practice",
    description: "Score 90%+ form in a session (10+ reps)",
    target: 1,
    unit: "sessions",
    check: (w) =>
      w.filter((x) => x.averageFormScore >= 90 && x.count >= 10).length,
  },
  {
    id: "single-25",
    title: "Quick Set",
    description: "25 push-ups in a single session",
    target: 1,
    unit: "sessions",
    check: (w) => w.filter((x) => x.count >= 25).length,
  },
  {
    id: "single-40",
    title: "Power Set",
    description: "40 push-ups in a single session",
    target: 1,
    unit: "sessions",
    check: (w) => w.filter((x) => x.count >= 40).length,
  },
];

export function getTodaysChallenge(): DailyChallenge {
  const seed = getDaySeed();
  const index = seed % CHALLENGE_POOL.length;
  return CHALLENGE_POOL[index];
}

export function getTodaysWorkouts(
  allWorkouts: WorkoutSession[],
  userId: string
): WorkoutSession[] {
  const today = new Date().toISOString().split("T")[0];
  return allWorkouts.filter(
    (w) => w.userId === userId && w.date.split("T")[0] === today
  );
}

export function getChallengeProgress(
  challenge: DailyChallenge,
  todaysWorkouts: WorkoutSession[]
): { current: number; target: number; completed: boolean; percent: number } {
  const current = challenge.check(todaysWorkouts);
  const completed = current >= challenge.target;
  const percent = Math.min(100, Math.round((current / challenge.target) * 100));
  return { current, target: challenge.target, completed, percent };
}
