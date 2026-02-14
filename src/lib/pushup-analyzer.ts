import { PoseKeypoint, PushupState } from "@/types";
import { getKeypointByName, calculateAngle } from "./pose-detection";

const CONFIDENCE_THRESHOLD = 0.3;
const ELBOW_DOWN_ANGLE = 90; // Elbow angle threshold for "down" position
const ELBOW_UP_ANGLE = 160; // Elbow angle threshold for "up" position
const BODY_ALIGNMENT_THRESHOLD = 160; // Min angle for good body alignment

interface AnalyzerState {
  phase: "up" | "down" | "transition";
  count: number;
  wasDown: boolean;
  formScores: number[];
  lastElbowAngle: number;
  lastBodyAlignment: number;
  repTimestamps: number[];
  consecutiveBadFrames: number;
  framesSinceLastRep: number;
}

let state: AnalyzerState = createFreshState();

function createFreshState(): AnalyzerState {
  return {
    phase: "up",
    count: 0,
    wasDown: false,
    formScores: [],
    lastElbowAngle: 180,
    lastBodyAlignment: 180,
    repTimestamps: [],
    consecutiveBadFrames: 0,
    framesSinceLastRep: 0,
  };
}

export function resetAnalyzer(): void {
  state = createFreshState();
}

export function getRepTimestamps(): number[] {
  return [...state.repTimestamps];
}

export function analyzePushup(keypoints: PoseKeypoint[]): PushupState {
  const leftShoulder = getKeypointByName(keypoints, "left_shoulder");
  const rightShoulder = getKeypointByName(keypoints, "right_shoulder");
  const leftElbow = getKeypointByName(keypoints, "left_elbow");
  const rightElbow = getKeypointByName(keypoints, "right_elbow");
  const leftWrist = getKeypointByName(keypoints, "left_wrist");
  const rightWrist = getKeypointByName(keypoints, "right_wrist");
  const leftHip = getKeypointByName(keypoints, "left_hip");
  const rightHip = getKeypointByName(keypoints, "right_hip");
  const leftAnkle = getKeypointByName(keypoints, "left_ankle");
  const rightAnkle = getKeypointByName(keypoints, "right_ankle");

  // Check if we have enough confident keypoints
  const requiredPoints = [leftShoulder, leftElbow, leftWrist, leftHip];
  const hasEnoughPoints = requiredPoints.every(
    (p) => p && p.score > CONFIDENCE_THRESHOLD
  );

  if (!hasEnoughPoints) {
    state.consecutiveBadFrames++;
    return {
      phase: state.phase,
      count: state.count,
      formScore: 0,
      feedback: "Position yourself so your full body is visible",
      elbowAngle: state.lastElbowAngle,
      bodyAlignment: state.lastBodyAlignment,
    };
  }

  state.consecutiveBadFrames = 0;
  state.framesSinceLastRep++;

  // Use the side with higher confidence
  const useLeft =
    (leftElbow?.score || 0) + (leftShoulder?.score || 0) >
    (rightElbow?.score || 0) + (rightShoulder?.score || 0);

  const shoulder = useLeft ? leftShoulder! : rightShoulder!;
  const elbow = useLeft ? leftElbow! : rightElbow!;
  const wrist = useLeft ? leftWrist! : rightWrist!;
  const hip = useLeft ? leftHip! : rightHip!;
  const ankle = useLeft ? leftAnkle : rightAnkle;

  // Calculate elbow angle (the key metric for push-up detection)
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  state.lastElbowAngle = elbowAngle;

  // Calculate body alignment (shoulder-hip-ankle)
  let bodyAlignment = 180;
  if (ankle && ankle.score > CONFIDENCE_THRESHOLD) {
    bodyAlignment = calculateAngle(shoulder, hip, ankle);
  }
  state.lastBodyAlignment = bodyAlignment;

  // Form scoring
  let formScore = 100;
  let feedback = "";

  // Check body alignment (should be roughly straight)
  if (bodyAlignment < BODY_ALIGNMENT_THRESHOLD) {
    const penalty = Math.min(40, (BODY_ALIGNMENT_THRESHOLD - bodyAlignment) * 2);
    formScore -= penalty;
    if (bodyAlignment < 140) {
      feedback = "Keep your body straight — avoid sagging hips";
    } else {
      feedback = "Slight hip drop detected — engage your core";
    }
  }

  // Determine phase based on elbow angle
  const previousPhase = state.phase;

  if (elbowAngle <= ELBOW_DOWN_ANGLE) {
    state.phase = "down";
    state.wasDown = true;
    if (!feedback) feedback = "Good depth! Now push up";
  } else if (elbowAngle >= ELBOW_UP_ANGLE) {
    // Count a rep when transitioning from down to up
    if (state.wasDown && previousPhase !== "up" && state.framesSinceLastRep > 10) {
      state.count++;
      state.wasDown = false;
      state.formScores.push(formScore);
      state.repTimestamps.push(Date.now());
      state.framesSinceLastRep = 0;
      feedback = formScore >= 80 ? "Great rep!" : formScore >= 60 ? "Good rep — watch your form" : "Rep counted — try to improve form";
    }
    state.phase = "up";
    if (!feedback) feedback = state.count === 0 ? "Lower your chest to the ground" : "Good position — keep going!";
  } else {
    state.phase = "transition";
    if (!feedback) {
      feedback = state.wasDown ? "Push all the way up" : "Go lower for a full rep";
    }
  }

  // Check for too-fast reps (likely not real push-ups)
  if (state.repTimestamps.length >= 2) {
    const lastTwo = state.repTimestamps.slice(-2);
    const timeBetween = lastTwo[1] - lastTwo[0];
    if (timeBetween < 800) {
      formScore = Math.max(formScore - 30, 10);
      feedback = "Slow down for proper form";
    }
  }

  return {
    phase: state.phase,
    count: state.count,
    formScore: Math.max(0, Math.min(100, formScore)),
    feedback,
    elbowAngle: Math.round(elbowAngle),
    bodyAlignment: Math.round(bodyAlignment),
  };
}

export function getAverageFormScore(): number {
  if (state.formScores.length === 0) return 0;
  return Math.round(
    state.formScores.reduce((a, b) => a + b, 0) / state.formScores.length
  );
}
