import { PoseKeypoint, PushupState } from "@/types";
import { getKeypointByName, calculateAngle } from "./pose-detection";

const CONFIDENCE_THRESHOLD = 0.2;
const ELBOW_DOWN_ANGLE = 110; // Relaxed from 90 — camera angle makes elbows look wider
const ELBOW_UP_ANGLE = 150; // Relaxed from 160 — full lockout not always visible
const BODY_ALIGNMENT_THRESHOLD = 160;
const SMOOTHING_WINDOW = 5;
const MIN_FRAMES_BETWEEN_REPS = 8;
const SHOULDER_DROP_THRESHOLD = 15; // Minimum px shoulder must drop for a "down"

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
  // Smoothing buffers
  elbowAngleBuffer: number[];
  shoulderYBuffer: number[];
  // Shoulder tracking
  shoulderYAtUp: number | null;
  shoulderDropConfirmed: boolean;
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
    elbowAngleBuffer: [],
    shoulderYBuffer: [],
    shoulderYAtUp: null,
    shoulderDropConfirmed: false,
  };
}

export function resetAnalyzer(): void {
  state = createFreshState();
}

export function getRepTimestamps(): number[] {
  return [...state.repTimestamps];
}

function smoothedAverage(buffer: number[]): number {
  if (buffer.length === 0) return 0;
  return buffer.reduce((a, b) => a + b, 0) / buffer.length;
}

function pushToBuffer(buffer: number[], value: number, maxLen: number): void {
  buffer.push(value);
  if (buffer.length > maxLen) buffer.shift();
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

  // Accept EITHER side having enough confident keypoints
  const leftConfidence = [leftShoulder, leftElbow, leftWrist, leftHip].every(
    (p) => p && p.score > CONFIDENCE_THRESHOLD
  );
  const rightConfidence = [rightShoulder, rightElbow, rightWrist, rightHip].every(
    (p) => p && p.score > CONFIDENCE_THRESHOLD
  );

  if (!leftConfidence && !rightConfidence) {
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

  // Use the side with higher total confidence
  const leftScore =
    (leftElbow?.score || 0) + (leftShoulder?.score || 0) + (leftWrist?.score || 0);
  const rightScore =
    (rightElbow?.score || 0) + (rightShoulder?.score || 0) + (rightWrist?.score || 0);
  const useLeft = leftConfidence && (!rightConfidence || leftScore >= rightScore);

  const shoulder = useLeft ? leftShoulder! : rightShoulder!;
  const elbow = useLeft ? leftElbow! : rightElbow!;
  const wrist = useLeft ? leftWrist! : rightWrist!;
  const hip = useLeft ? leftHip! : rightHip!;
  const ankle = useLeft ? leftAnkle : rightAnkle;

  // Calculate raw elbow angle then smooth it
  const rawElbowAngle = calculateAngle(shoulder, elbow, wrist);
  pushToBuffer(state.elbowAngleBuffer, rawElbowAngle, SMOOTHING_WINDOW);
  const elbowAngle = smoothedAverage(state.elbowAngleBuffer);
  state.lastElbowAngle = elbowAngle;

  // Track shoulder Y position (increases as user goes down in screen coords)
  const shoulderY = shoulder.y;
  pushToBuffer(state.shoulderYBuffer, shoulderY, SMOOTHING_WINDOW);
  const smoothedShoulderY = smoothedAverage(state.shoulderYBuffer);

  // Calculate body alignment (shoulder-hip-ankle)
  let bodyAlignment = 180;
  if (ankle && ankle.score > CONFIDENCE_THRESHOLD) {
    bodyAlignment = calculateAngle(shoulder, hip, ankle);
  }
  state.lastBodyAlignment = bodyAlignment;

  // Form scoring
  let formScore = 100;
  let feedback = "";

  // Check body alignment
  if (bodyAlignment < BODY_ALIGNMENT_THRESHOLD) {
    const penalty = Math.min(40, (BODY_ALIGNMENT_THRESHOLD - bodyAlignment) * 2);
    formScore -= penalty;
    if (bodyAlignment < 140) {
      feedback = "Keep your body straight — avoid sagging hips";
    } else {
      feedback = "Slight hip drop detected — engage your core";
    }
  }

  // Determine phase based on smoothed elbow angle + shoulder tracking
  const previousPhase = state.phase;

  // Record shoulder position when in "up" phase for drop detection
  if (state.phase === "up" && state.shoulderYAtUp === null) {
    state.shoulderYAtUp = smoothedShoulderY;
  }

  if (elbowAngle <= ELBOW_DOWN_ANGLE) {
    state.phase = "down";
    state.wasDown = true;

    // Confirm shoulder actually dropped
    if (state.shoulderYAtUp !== null) {
      const drop = smoothedShoulderY - state.shoulderYAtUp;
      if (drop > SHOULDER_DROP_THRESHOLD) {
        state.shoulderDropConfirmed = true;
      }
    }

    if (!feedback) feedback = "Good depth! Now push up";
  } else if (elbowAngle >= ELBOW_UP_ANGLE) {
    // Count a rep when transitioning from down to up
    if (
      state.wasDown &&
      previousPhase !== "up" &&
      state.framesSinceLastRep > MIN_FRAMES_BETWEEN_REPS
    ) {
      state.count++;
      state.wasDown = false;
      state.shoulderDropConfirmed = false;
      state.shoulderYAtUp = smoothedShoulderY;
      state.formScores.push(formScore);
      state.repTimestamps.push(Date.now());
      state.framesSinceLastRep = 0;
      feedback =
        formScore >= 80
          ? "Great rep!"
          : formScore >= 60
            ? "Good rep — watch your form"
            : "Rep counted — try to improve form";
    }
    state.phase = "up";
    if (!feedback)
      feedback =
        state.count === 0
          ? "Lower your chest to the ground"
          : "Good position — keep going!";
  } else {
    state.phase = "transition";
    if (!feedback) {
      feedback = state.wasDown ? "Push all the way up" : "Go lower for a full rep";
    }
  }

  // Check for too-fast reps
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
