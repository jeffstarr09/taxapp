import { PoseKeypoint, PushupState } from "@/types";
import { getKeypointByName, calculateAngle } from "./pose-detection";
import { getActiveThresholds } from "./calibration";
import { recordFrame, recordRep } from "./telemetry";

interface Thresholds {
  elbowDownAngle: number;
  elbowUpAngle: number;
  shoulderDropThreshold: number;
  minFramesBetweenReps: number;
  confidenceThreshold: number;
  bodyAlignmentThreshold: number;
}

const SMOOTHING_WINDOW = 5;

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
  // Per-rep tracking for telemetry
  currentRepElbowMin: number;
  currentRepElbowMax: number;
  // Active thresholds
  thresholds: Thresholds;
}

let state: AnalyzerState = createFreshState();

function createFreshState(userId?: string): AnalyzerState {
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
    currentRepElbowMin: 180,
    currentRepElbowMax: 0,
    thresholds: getActiveThresholds(userId),
  };
}

export function resetAnalyzer(userId?: string): void {
  state = createFreshState(userId);
}

export function getRepTimestamps(): number[] {
  return [...state.repTimestamps];
}

export function getActiveAnalyzerThresholds(): Thresholds {
  return { ...state.thresholds };
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
  const t = state.thresholds;

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
    (p) => p && p.score > t.confidenceThreshold
  );
  const rightConfidence = [rightShoulder, rightElbow, rightWrist, rightHip].every(
    (p) => p && p.score > t.confidenceThreshold
  );

  if (!leftConfidence && !rightConfidence) {
    state.consecutiveBadFrames++;
    recordFrame({
      hasPose: false,
      confidence: 0,
      elbowAngle: state.lastElbowAngle,
      shoulderY: 0,
      bodyAlignment: state.lastBodyAlignment,
    });
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

  // Track per-rep min/max
  state.currentRepElbowMin = Math.min(state.currentRepElbowMin, elbowAngle);
  state.currentRepElbowMax = Math.max(state.currentRepElbowMax, elbowAngle);

  // Track shoulder Y position (increases as user goes down in screen coords)
  const shoulderY = shoulder.y;
  pushToBuffer(state.shoulderYBuffer, shoulderY, SMOOTHING_WINDOW);
  const smoothedShoulderY = smoothedAverage(state.shoulderYBuffer);

  // Calculate body alignment (shoulder-hip-ankle)
  let bodyAlignment = 180;
  if (ankle && ankle.score > t.confidenceThreshold) {
    bodyAlignment = calculateAngle(shoulder, hip, ankle);
  }
  state.lastBodyAlignment = bodyAlignment;

  // Avg confidence for this frame
  const avgConfidence = useLeft
    ? (leftShoulder!.score + leftElbow!.score + leftWrist!.score + leftHip!.score) / 4
    : (rightShoulder!.score + rightElbow!.score + rightWrist!.score + rightHip!.score) / 4;

  // Record telemetry
  recordFrame({
    hasPose: true,
    confidence: avgConfidence,
    elbowAngle,
    shoulderY: smoothedShoulderY,
    bodyAlignment,
  });

  // Form scoring
  let formScore = 100;
  let feedback = "";

  // Check body alignment
  if (bodyAlignment < t.bodyAlignmentThreshold) {
    const penalty = Math.min(40, (t.bodyAlignmentThreshold - bodyAlignment) * 2);
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

  if (elbowAngle <= t.elbowDownAngle) {
    state.phase = "down";
    state.wasDown = true;

    // Confirm shoulder actually dropped
    if (state.shoulderYAtUp !== null) {
      const drop = smoothedShoulderY - state.shoulderYAtUp;
      if (drop > t.shoulderDropThreshold) {
        state.shoulderDropConfirmed = true;
      }
    }

    if (!feedback) feedback = "Good depth! Now push up";
  } else if (elbowAngle >= t.elbowUpAngle) {
    // Count a rep when transitioning from down to up
    if (
      state.wasDown &&
      previousPhase !== "up" &&
      state.framesSinceLastRep > t.minFramesBetweenReps
    ) {
      state.count++;
      state.wasDown = false;
      state.shoulderDropConfirmed = false;
      state.shoulderYAtUp = smoothedShoulderY;
      state.formScores.push(formScore);
      state.repTimestamps.push(Date.now());
      state.framesSinceLastRep = 0;

      // Record rep telemetry
      const lastTimestamp = state.repTimestamps.length >= 2
        ? state.repTimestamps[state.repTimestamps.length - 1] - state.repTimestamps[state.repTimestamps.length - 2]
        : 0;
      recordRep({
        elbowMin: state.currentRepElbowMin,
        elbowMax: state.currentRepElbowMax,
        duration: lastTimestamp,
        formScore,
      });

      // Reset per-rep tracking
      state.currentRepElbowMin = 180;
      state.currentRepElbowMax = 0;

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
