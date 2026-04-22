import { ExerciseType } from "@/types";

export interface ExerciseConfig {
  type: ExerciseType;
  label: string;
  labelPlural: string;
  icon: string;
  description: string;
  setupTips: string[];
  cameraAngle: string;
  setupImage: string;
  guideImage: string;
  guideRotatePortrait: boolean;
  available: boolean; // false = coming soon
}

export const EXERCISE_CONFIGS: Record<ExerciseType, ExerciseConfig> = {
  pushup: {
    type: "pushup",
    label: "Push-up",
    labelPlural: "Push-ups",
    icon: "🫳",
    description: "AI-verified push-ups with real-time form tracking",
    setupTips: [
      "Side-angle camera works best",
      "Ensure full body is in frame",
      "Good lighting improves accuracy",
      "Go all the way down & up",
    ],
    cameraAngle: "Side view — full body in frame",
    setupImage: "/workout-setup.png",
    guideImage: "/pushupoverlay.png",
    guideRotatePortrait: true,
    available: true,
  },
  pullup: {
    type: "pullup",
    label: "Pull-up",
    labelPlural: "Pull-ups",
    icon: "💪",
    description: "Track pull-ups with AI form detection",
    setupTips: [
      "Front or side angle works",
      "Ensure full body is in frame",
      "Good lighting improves accuracy",
      "Full hang to chin over bar",
    ],
    cameraAngle: "Front or side view — full body in frame",
    setupImage: "/workout-setup.png",
    guideImage: "/pushupoverlay.png",
    guideRotatePortrait: false,
    available: false,
  },
  squat: {
    type: "squat",
    label: "Squat",
    labelPlural: "Squats",
    icon: "🦵",
    description: "AI-verified squats with depth tracking",
    setupTips: [
      "Side angle camera works best",
      "Ensure full body is in frame",
      "Good lighting improves accuracy",
      "Go below parallel for full credit",
    ],
    cameraAngle: "Side view — full body in frame",
    setupImage: "/squat.png",
    guideImage: "/squatoverlay.png",
    guideRotatePortrait: false,
    available: true,
  },
  situp: {
    type: "situp",
    label: "Sit-up",
    labelPlural: "Sit-ups",
    icon: "🔥",
    description: "AI-verified sit-ups with form tracking",
    setupTips: [
      "Side angle camera works best",
      "Lie down with knees bent",
      "Good lighting improves accuracy",
      "Full range of motion — chest to knees",
    ],
    cameraAngle: "Side view — full body in frame",
    setupImage: "/situp.png",
    guideImage: "/situpoverlay.png",
    guideRotatePortrait: true,
    available: true,
  },
};

export function getExerciseConfig(type: ExerciseType): ExerciseConfig {
  return EXERCISE_CONFIGS[type];
}

export function getAvailableExercises(): ExerciseConfig[] {
  return Object.values(EXERCISE_CONFIGS).filter((c) => c.available);
}

export function getAllExercises(): ExerciseConfig[] {
  return Object.values(EXERCISE_CONFIGS);
}

export function getRepLabel(type: ExerciseType, count: number): string {
  const config = EXERCISE_CONFIGS[type];
  return count === 1 ? config.label : config.labelPlural;
}
