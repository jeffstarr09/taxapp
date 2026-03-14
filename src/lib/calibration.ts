/**
 * Calibration system for per-user pushup detection thresholds.
 *
 * Users do a few test reps during calibration. We record the actual
 * elbow angles at the top and bottom of each rep, then set personalized
 * thresholds based on their body proportions and camera setup.
 */

export interface CalibrationProfile {
  id: string;
  userId: string;
  elbowDownAngle: number;
  elbowUpAngle: number;
  shoulderDropThreshold: number;
  minFramesBetweenReps: number;
  confidenceThreshold: number;
  bodyAlignmentThreshold: number;
  calibratedAt: string;
  testRepCount: number;
  // Raw data from calibration session
  rawElbowMins: number[];
  rawElbowMaxes: number[];
  rawShoulderDrops: number[];
}

export interface CalibrationFrame {
  elbowAngle: number;
  shoulderY: number;
  timestamp: number;
}

const CALIBRATION_KEY = "pushup_calibration";
const DEFAULT_PROFILE: Omit<CalibrationProfile, "id" | "userId" | "calibratedAt" | "testRepCount" | "rawElbowMins" | "rawElbowMaxes" | "rawShoulderDrops"> = {
  elbowDownAngle: 110,
  elbowUpAngle: 150,
  shoulderDropThreshold: 15,
  minFramesBetweenReps: 8,
  confidenceThreshold: 0.2,
  bodyAlignmentThreshold: 160,
};

export function getCalibrationProfile(userId?: string): CalibrationProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CALIBRATION_KEY);
    if (!stored) return null;
    const profiles: CalibrationProfile[] = JSON.parse(stored);
    if (userId) {
      return profiles.find((p) => p.userId === userId) || null;
    }
    return profiles[profiles.length - 1] || null;
  } catch {
    return null;
  }
}

export function getActiveThresholds(userId?: string) {
  const profile = getCalibrationProfile(userId);
  if (profile) {
    return {
      elbowDownAngle: profile.elbowDownAngle,
      elbowUpAngle: profile.elbowUpAngle,
      shoulderDropThreshold: profile.shoulderDropThreshold,
      minFramesBetweenReps: profile.minFramesBetweenReps,
      confidenceThreshold: profile.confidenceThreshold,
      bodyAlignmentThreshold: profile.bodyAlignmentThreshold,
    };
  }
  return { ...DEFAULT_PROFILE };
}

export function saveCalibrationProfile(profile: CalibrationProfile): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(CALIBRATION_KEY);
    const profiles: CalibrationProfile[] = stored ? JSON.parse(stored) : [];
    const existingIdx = profiles.findIndex((p) => p.userId === profile.userId);
    if (existingIdx >= 0) {
      profiles[existingIdx] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(profiles));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Process raw calibration frames into a profile.
 *
 * During calibration the user does 3-5 reps while we record every frame's
 * elbow angle and shoulder Y. We find the min/max of each rep cycle to
 * derive personalized thresholds.
 */
export function processCalibrationData(
  frames: CalibrationFrame[],
  userId: string
): CalibrationProfile | null {
  if (frames.length < 30) return null; // Need at least ~1 second of data

  const angles = frames.map((f) => f.elbowAngle);
  const shoulderYs = frames.map((f) => f.shoulderY);

  // Find rep cycles: look for local mins and maxes in elbow angle
  const mins: number[] = [];
  const maxes: number[] = [];
  const shoulderDrops: number[] = [];

  // Simple peak/valley detection with smoothing
  const windowSize = 5;
  const smoothed = angles.map((_, i) => {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(angles.length, i + Math.ceil(windowSize / 2));
    const slice = angles.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  let direction: "up" | "down" | null = null;
  let lastPeakIdx = 0;

  for (let i = 1; i < smoothed.length; i++) {
    const diff = smoothed[i] - smoothed[i - 1];
    if (diff > 0.5 && direction === "down") {
      // Valley found (elbow angle minimum = bottom of pushup)
      mins.push(smoothed[i - 1]);
      // Calculate shoulder drop from last peak to this valley
      const peakShoulderY = shoulderYs[lastPeakIdx];
      const valleyShoulderY = shoulderYs[i - 1];
      shoulderDrops.push(valleyShoulderY - peakShoulderY);
      direction = "up";
    } else if (diff < -0.5 && direction === "up") {
      // Peak found (elbow angle maximum = top of pushup)
      maxes.push(smoothed[i - 1]);
      lastPeakIdx = i - 1;
      direction = "down";
    } else if (direction === null) {
      direction = diff > 0 ? "up" : "down";
    }
  }

  // Need at least 2 reps worth of data
  if (mins.length < 2 || maxes.length < 2) return null;

  // Set thresholds with margins
  // Down angle: midpoint between average min and average max, biased toward min
  const avgMin = mins.reduce((a, b) => a + b, 0) / mins.length;
  const avgMax = maxes.reduce((a, b) => a + b, 0) / maxes.length;
  const avgDrop = shoulderDrops.length > 0
    ? shoulderDrops.reduce((a, b) => a + b, 0) / shoulderDrops.length
    : 15;

  // Down threshold: 30% of the way from min to max (generous to count)
  const elbowDownAngle = Math.round(avgMin + (avgMax - avgMin) * 0.3);
  // Up threshold: 80% of the way from min to max
  const elbowUpAngle = Math.round(avgMin + (avgMax - avgMin) * 0.8);
  // Shoulder drop: 60% of measured average (generous)
  const shoulderDropThreshold = Math.max(5, Math.round(avgDrop * 0.6));

  const profile: CalibrationProfile = {
    id: `cal-${Date.now()}`,
    userId,
    elbowDownAngle: Math.max(70, Math.min(130, elbowDownAngle)),
    elbowUpAngle: Math.max(130, Math.min(175, elbowUpAngle)),
    shoulderDropThreshold: Math.max(5, Math.min(50, shoulderDropThreshold)),
    minFramesBetweenReps: DEFAULT_PROFILE.minFramesBetweenReps,
    confidenceThreshold: DEFAULT_PROFILE.confidenceThreshold,
    bodyAlignmentThreshold: DEFAULT_PROFILE.bodyAlignmentThreshold,
    calibratedAt: new Date().toISOString(),
    testRepCount: mins.length,
    rawElbowMins: mins.map(Math.round),
    rawElbowMaxes: maxes.map(Math.round),
    rawShoulderDrops: shoulderDrops.map(Math.round),
  };

  saveCalibrationProfile(profile);
  return profile;
}

export function deleteCalibration(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(CALIBRATION_KEY);
    if (!stored) return;
    const profiles: CalibrationProfile[] = JSON.parse(stored);
    const filtered = profiles.filter((p) => p.userId !== userId);
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}
