import { PoseKeypoint, ExerciseState } from "@/types";
import { getKeypointByName, calculateAngle } from "./pose-detection";
import { recordFrame, recordRep } from "./telemetry";

const SMOOTHING_WINDOW = 5;

const THRESHOLDS = {
  hipDownAngle: 140,
  hipUpAngle: 100,
  minFramesBetweenReps: 10,
  confidenceThreshold: 0.3,
  readyFramesRequired: 40,
};

interface SitupState {
  phase: "up" | "down" | "transition";
  count: number;
  wasUp: boolean;
  formScores: number[];
  lastHipAngle: number;
  repTimestamps: number[];
  framesSinceLastRep: number;
  hipAngleBuffer: number[];
  readyFrames: number;
  isReady: boolean;
}

let state: SitupState = createFreshState();

function createFreshState(): SitupState {
  return {
    phase: "down",
    count: 0,
    wasUp: false,
    formScores: [],
    lastHipAngle: 180,
    repTimestamps: [],
    framesSinceLastRep: 0,
    hipAngleBuffer: [],
    readyFrames: 0,
    isReady: false,
  };
}

export function resetSitupAnalyzer(): void {
  state = createFreshState();
}

export function getSitupRepTimestamps(): number[] {
  return [...state.repTimestamps];
}

export function getSitupAverageFormScore(): number {
  if (state.formScores.length === 0) return 0;
  return Math.round(
    state.formScores.reduce((a, b) => a + b, 0) / state.formScores.length
  );
}

export function isSitupAnalyzerReady(): boolean {
  return state.isReady;
}

function smoothedAverage(buffer: number[]): number {
  if (buffer.length === 0) return 0;
  return buffer.reduce((a, b) => a + b, 0) / buffer.length;
}

function pushToBuffer(buffer: number[], value: number, maxLen: number): void {
  buffer.push(value);
  if (buffer.length > maxLen) buffer.shift();
}

export function analyzeSitup(keypoints: PoseKeypoint[]): ExerciseState {
  const t = THRESHOLDS;

  const leftShoulder = getKeypointByName(keypoints, "left_shoulder");
  const rightShoulder = getKeypointByName(keypoints, "right_shoulder");
  const leftHip = getKeypointByName(keypoints, "left_hip");
  const rightHip = getKeypointByName(keypoints, "right_hip");
  const leftKnee = getKeypointByName(keypoints, "left_knee");
  const rightKnee = getKeypointByName(keypoints, "right_knee");

  const leftConfidence = [leftShoulder, leftHip, leftKnee].every(
    (p) => p && p.score > t.confidenceThreshold
  );
  const rightConfidence = [rightShoulder, rightHip, rightKnee].every(
    (p) => p && p.score > t.confidenceThreshold
  );

  if (!leftConfidence && !rightConfidence) {
    recordFrame({ hasPose: false, confidence: 0, elbowAngle: 0, shoulderY: 0, bodyAlignment: 0 });
    return {
      phase: state.phase,
      count: state.count,
      formScore: 0,
      feedback: "Position yourself so your full body is visible",
      elbowAngle: 0,
      bodyAlignment: state.lastHipAngle,
    };
  }

  state.framesSinceLastRep++;

  // Readiness: need to see shoulder, hip, and knee — user should be lying down
  if (!state.isReady) {
    state.readyFrames++;
    if (state.readyFrames >= t.readyFramesRequired) {
      state.isReady = true;
    }
    if (!state.isReady) {
      recordFrame({ hasPose: true, confidence: 0.5, elbowAngle: 0, shoulderY: 0, bodyAlignment: 0 });
      return {
        phase: state.phase,
        count: state.count,
        formScore: 0,
        feedback: "Getting ready... lie on your back with knees bent",
        elbowAngle: 0,
        bodyAlignment: state.lastHipAngle,
      };
    }
  }

  // Use the side with higher confidence
  const useLeft = leftConfidence && (!rightConfidence ||
    ((leftShoulder?.score || 0) + (leftHip?.score || 0) + (leftKnee?.score || 0)) >=
    ((rightShoulder?.score || 0) + (rightHip?.score || 0) + (rightKnee?.score || 0)));

  const shoulder = useLeft ? leftShoulder! : rightShoulder!;
  const hip = useLeft ? leftHip! : rightHip!;
  const knee = useLeft ? leftKnee! : rightKnee!;

  // Hip angle: shoulder-hip-knee
  const rawHipAngle = calculateAngle(shoulder, hip, knee);
  pushToBuffer(state.hipAngleBuffer, rawHipAngle, SMOOTHING_WINDOW);
  const hipAngle = smoothedAverage(state.hipAngleBuffer);
  state.lastHipAngle = hipAngle;

  const avgConfidence = ((shoulder.score) + (hip.score) + (knee.score)) / 3;
  recordFrame({ hasPose: true, confidence: avgConfidence, elbowAngle: 0, shoulderY: shoulder.y, bodyAlignment: hipAngle });

  let formScore = 100;
  let feedback = "";

  // Phase detection based on hip angle
  // Down: lying flat, hip angle is wide (>140)
  // Up: torso raised toward knees, hip angle is narrow (<100)
  const previousPhase = state.phase;

  if (hipAngle <= t.hipUpAngle) {
    state.phase = "up";
    state.wasUp = true;
    if (!feedback) feedback = "Good crunch! Now lower back down";
  } else if (hipAngle >= t.hipDownAngle) {
    // Count a rep when transitioning from up back to down
    if (
      state.wasUp &&
      previousPhase !== "down" &&
      state.framesSinceLastRep > t.minFramesBetweenReps
    ) {
      state.count++;
      state.wasUp = false;
      state.formScores.push(formScore);
      state.repTimestamps.push(Date.now());
      state.framesSinceLastRep = 0;

      const lastTimestamp = state.repTimestamps.length >= 2
        ? state.repTimestamps[state.repTimestamps.length - 1] - state.repTimestamps[state.repTimestamps.length - 2]
        : 0;
      recordRep({ elbowMin: 0, elbowMax: 0, duration: lastTimestamp, formScore });

      feedback = formScore >= 80 ? "Great rep!" : "Rep counted — control the motion";
    }
    state.phase = "down";
    if (!feedback) {
      feedback = state.count === 0 ? "Curl up toward your knees" : "Good — keep going!";
    }
  } else {
    state.phase = "transition";
    if (!feedback) {
      feedback = state.wasUp ? "Lower all the way back down" : "Come up higher for a full rep";
    }
  }

  // Penalize too-fast reps
  if (state.repTimestamps.length >= 2) {
    const lastTwo = state.repTimestamps.slice(-2);
    if (lastTwo[1] - lastTwo[0] < 700) {
      formScore = Math.max(formScore - 30, 10);
      feedback = "Slow down for proper form";
    }
  }

  return {
    phase: state.phase,
    count: state.count,
    formScore: Math.max(0, Math.min(100, formScore)),
    feedback,
    elbowAngle: 0,
    bodyAlignment: Math.round(hipAngle),
  };
}
