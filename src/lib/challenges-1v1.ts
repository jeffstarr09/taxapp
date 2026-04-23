import { ExerciseType } from "@/types";

export interface Challenge1v1 {
  id: string;
  creatorId: string;
  creatorName: string;
  exerciseType: ExerciseType;
  targetReps: number;
  expiresAt: string;
  createdAt: string;
}

export function createChallenge(
  creatorId: string,
  creatorName: string,
  exerciseType: ExerciseType,
  targetReps: number
): Challenge1v1 {
  const id = Math.random().toString(36).substring(2, 10);
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const challenge: Challenge1v1 = {
    id,
    creatorId,
    creatorName,
    exerciseType,
    targetReps,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  };

  if (typeof window !== "undefined") {
    const stored = JSON.parse(localStorage.getItem("drop_challenges") || "[]");
    stored.push(challenge);
    localStorage.setItem("drop_challenges", JSON.stringify(stored));
  }

  return challenge;
}

export function getChallenge(id: string): Challenge1v1 | null {
  if (typeof window === "undefined") return null;
  const stored: Challenge1v1[] = JSON.parse(localStorage.getItem("drop_challenges") || "[]");
  return stored.find((c) => c.id === id) || null;
}

export function getChallengeUrl(id: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://dropfit.app";
  return `${origin}/challenge/${id}`;
}
