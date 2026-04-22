import { PoseKeypoint, ExerciseState } from "@/types";
import { getKeypointByName, calculateAngle } from "./pose-detection";
import { recordFrame, recordRep } from "./telemetry";

const SMOOTHING_WINDOW = 5;

const THRESHOLDS = {
  kneeDownAngle: 110,
  kneeUpAngle: 155,
  minFramesBetweenReps: 10,
  confidenceThreshold: 0.3,
  readyFramesRequired: 40,
};

interface SquatState {
  phase: "up" | "down" | "transition";
  count: number;
  wasDown: boolean;
  formScores: number[];
  lastKneeAngle: number;
  repTimestamps: number[];
  framesSinceLastRep: number;
  kneeAngleBuffer: number[];
  readyFrames: number;
  isReady: boolean;
}

let state: SquatState = createFreshState();

function createFreshState(): SquatState {
  return {
    phase: "up",
    count: 0,
    wasDown: false,
    formScores: [],
    lastKneeAngle: 180,
    repTimestamps: [],
    framesSinceLastRep: 0,
    kneeAngleBuffer: [],
    readyFrames: 0,
    isReady: false,
  };
}

export function resetSquatAnalyzer(): void {
  state = createFreshState();
}

export function getSquatRepTimestamps(): number[] {
  return [...state.repTimestamps];
}

export function getSquatAverageFormScore(): number {
  if (state.formScores.length === 0) return 0;
  return Math.round(
    state.formScores.reduce((a, b) => a + b, 0) / state.formScores.length
  );
}

export function isSquatAnalyzerReady(): boolean {
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

export function analyzeSquat(keypoints: PoseKeypoint[]): ExerciseState {
  const t = THRESHOLDS;

  const leftHip = getKeypointByName(keypoints, "left_hip");
  const rightHip = getKeypointByName(keypoints, "right_hip");
  const leftKnee = getKeypointByName(keypoints, "left_knee");
  const rightKnee = getKeypointByName(keypoints, "right_knee");
  const leftAnkle = getKeypointByName(keypoints, "left_ankle");
  const rightAnkle = getKeypointByName(keypoints, "right_ankle");
  const leftShoulder = getKeypointByName(keypoints, "left_shoulder");
  const rightShoulder = getKeypointByName(keypoints, "right_shoulder");

  const leftConfidence = [leftHip, leftKnee, leftAnkle].every(
    (p) => p && p.score > t.confidenceThreshold
  );
  const rightConfidence = [rightHip, rightKnee, rightAnkle].every(
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
      bodyAlignment: state.lastKneeAngle,
    };
  }

  state.framesSinceLastRep++;

  // Readiness: see hip, knee, ankle — user should be standing
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
        feedback: "Getting ready... stand with feet shoulder-width apart",
        elbowAngle: 0,
        bodyAlignment: state.lastKneeAngle,
      };
    }
  }

  const useLeft = leftConfidence && (!rightConfidence ||
    ((leftHip?.score || 0) + (leftKnee?.score || 0) + (leftAnkle?.score || 0)) >=
    ((rightHip?.score || 0) + (rightKnee?.score || 0) + (rightAnkle?.score || 0)));

  const hip = useLeft ? leftHip! : rightHip!;
  const knee = useLeft ? leftKnee! : rightKnee!;
  const ankle = useLeft ? leftAnkle! : rightAnkle!;
  const shoulder = useLeft ? leftShoulder : rightShoulder;

  // Knee angle: hip-knee-ankle
  const rawKneeAngle = calculateAngle(hip, knee, ankle);
  pushToBuffer(state.kneeAngleBuffer, rawKneeAngle, SMOOTHING_WINDOW);
  const kneeAngle = smoothedAverage(state.kneeAngleBuffer);
  state.lastKneeAngle = kneeAngle;

  const avgConfidence = ((hip.score) + (knee.score) + (ankle.score)) / 3;
  recordFrame({ hasPose: true, confidence: avgConfidence, elbowAngle: 0, shoulderY: shoulder?.y || 0, bodyAlignment: kneeAngle });

  let formScore = 100;
  let feedback = "";

  // Check torso lean — shoulder should stay roughly above hips
  if (shoulder && shoulder.score > t.confidenceThreshold) {
    const torsoAngle = calculateAngle(shoulder, hip, { x: hip.x, y: hip.y + 100 });
    if (torsoAngle > 45) {
      formScore -= 20;
      if (!feedback) feedback = "Keep your chest up — avoid leaning too far forward";
    }
  }

  const previousPhase = state.phase;

  if (kneeAngle <= t.kneeDownAngle) {
    state.phase = "down";
    state.wasDown = true;
    if (!feedback) feedback = "Good depth! Now stand back up";
  } else if (kneeAngle >= t.kneeUpAngle) {
    if (
      state.wasDown &&
      previousPhase !== "up" &&
      state.framesSinceLastRep > t.minFramesBetweenReps
    ) {
      state.count++;
      state.wasDown = false;
      state.formScores.push(formScore);
      state.repTimestamps.push(Date.now());
      state.framesSinceLastRep = 0;

      const lastTimestamp = state.repTimestamps.length >= 2
        ? state.repTimestamps[state.repTimestamps.length - 1] - state.repTimestamps[state.repTimestamps.length - 2]
        : 0;
      recordRep({ elbowMin: 0, elbowMax: 0, duration: lastTimestamp, formScore });

      feedback = formScore >= 80 ? "Great squat!" : "Rep counted — watch your form";
    }
    state.phase = "up";
    if (!feedback) {
      feedback = state.count === 0 ? "Squat down — hips below knees" : "Good — keep going!";
    }
  } else {
    state.phase = "transition";
    if (!feedback) {
      feedback = state.wasDown ? "Stand all the way up" : "Go deeper for a full rep";
    }
  }

  // Penalize too-fast reps
  if (state.repTimestamps.length >= 2) {
    const lastTwo = state.repTimestamps.slice(-2);
    if (lastTwo[1] - lastTwo[0] < 800) {
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
    bodyAlignment: Math.round(kneeAngle),
  };
}
