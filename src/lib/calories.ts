import { ExerciseType } from "@/types";

const CALORIES_PER_REP: Record<ExerciseType, number> = {
  pushup: 0.4,
  situp: 0.2,
  squat: 0.3,
  pullup: 0.5,
};

export function caloriesForReps(exerciseType: ExerciseType, count: number): number {
  return Math.round(count * (CALORIES_PER_REP[exerciseType] ?? 0.3) * 10) / 10;
}

export function totalCalories(workouts: { exerciseType: ExerciseType; count: number }[]): number {
  return Math.round(
    workouts.reduce((sum, w) => sum + w.count * (CALORIES_PER_REP[w.exerciseType] ?? 0.3), 0) * 10
  ) / 10;
}
