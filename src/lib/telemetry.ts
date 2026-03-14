/**
 * Telemetry collection for continuous improvement of pushup detection.
 *
 * Collects per-session data about detection quality, angle distributions,
 * and user feedback. Stored locally now — ready to sync to Firebase later.
 */

export interface SessionTelemetry {
  id: string;
  userId: string;
  sessionDate: string;
  // Detection quality
  totalFrames: number;
  framesWithPose: number;
  framesWithoutPose: number;
  avgConfidence: number;
  // Angle distributions (sampled every 10 frames)
  elbowAngleSamples: number[];
  shoulderYSamples: number[];
  bodyAlignmentSamples: number[];
  // Per-rep data
  repElbowMins: number[];
  repElbowMaxes: number[];
  repDurations: number[]; // ms between consecutive reps
  repFormScores: number[];
  // User feedback (filled in post-session)
  userReportedCount: number | null; // null = user didn't correct
  countAccuracyRating: "accurate" | "overcounted" | "undercounted" | null;
  feedbackNote: string;
  // Thresholds used
  thresholdsUsed: {
    elbowDownAngle: number;
    elbowUpAngle: number;
    shoulderDropThreshold: number;
  };
  // Calibration
  wasCalibrated: boolean;
}

const TELEMETRY_KEY = "pushup_telemetry";
const MAX_STORED_SESSIONS = 50;

// Live collector (accumulates during a session)
let liveSession: Partial<SessionTelemetry> & {
  frameCount: number;
  poseFrameCount: number;
  confidenceSum: number;
  sampleCounter: number;
} = createLiveSession();

function createLiveSession() {
  return {
    frameCount: 0,
    poseFrameCount: 0,
    confidenceSum: 0,
    sampleCounter: 0,
    elbowAngleSamples: [] as number[],
    shoulderYSamples: [] as number[],
    bodyAlignmentSamples: [] as number[],
    repElbowMins: [] as number[],
    repElbowMaxes: [] as number[],
    repDurations: [] as number[],
    repFormScores: [] as number[],
  };
}

export function resetTelemetry(): void {
  liveSession = createLiveSession();
}

export function recordFrame(data: {
  hasPose: boolean;
  confidence: number;
  elbowAngle: number;
  shoulderY: number;
  bodyAlignment: number;
}): void {
  liveSession.frameCount++;

  if (data.hasPose) {
    liveSession.poseFrameCount++;
    liveSession.confidenceSum += data.confidence;

    // Sample every 10 frames to keep storage reasonable
    liveSession.sampleCounter++;
    if (liveSession.sampleCounter % 10 === 0) {
      liveSession.elbowAngleSamples!.push(Math.round(data.elbowAngle));
      liveSession.shoulderYSamples!.push(Math.round(data.shoulderY));
      liveSession.bodyAlignmentSamples!.push(Math.round(data.bodyAlignment));
    }
  }
}

export function recordRep(data: {
  elbowMin: number;
  elbowMax: number;
  duration: number;
  formScore: number;
}): void {
  liveSession.repElbowMins!.push(Math.round(data.elbowMin));
  liveSession.repElbowMaxes!.push(Math.round(data.elbowMax));
  liveSession.repDurations!.push(Math.round(data.duration));
  liveSession.repFormScores!.push(Math.round(data.formScore));
}

export function finishSession(
  userId: string,
  thresholds: { elbowDownAngle: number; elbowUpAngle: number; shoulderDropThreshold: number },
  wasCalibrated: boolean
): SessionTelemetry {
  const session: SessionTelemetry = {
    id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    sessionDate: new Date().toISOString(),
    totalFrames: liveSession.frameCount,
    framesWithPose: liveSession.poseFrameCount,
    framesWithoutPose: liveSession.frameCount - liveSession.poseFrameCount,
    avgConfidence:
      liveSession.poseFrameCount > 0
        ? Math.round((liveSession.confidenceSum / liveSession.poseFrameCount) * 100) / 100
        : 0,
    elbowAngleSamples: liveSession.elbowAngleSamples || [],
    shoulderYSamples: liveSession.shoulderYSamples || [],
    bodyAlignmentSamples: liveSession.bodyAlignmentSamples || [],
    repElbowMins: liveSession.repElbowMins || [],
    repElbowMaxes: liveSession.repElbowMaxes || [],
    repDurations: liveSession.repDurations || [],
    repFormScores: liveSession.repFormScores || [],
    userReportedCount: null,
    countAccuracyRating: null,
    feedbackNote: "",
    thresholdsUsed: thresholds,
    wasCalibrated,
  };

  resetTelemetry();
  return session;
}

export function saveTelemetrySession(session: SessionTelemetry): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(TELEMETRY_KEY);
    const sessions: SessionTelemetry[] = stored ? JSON.parse(stored) : [];
    sessions.push(session);
    // Keep only recent sessions
    while (sessions.length > MAX_STORED_SESSIONS) {
      sessions.shift();
    }
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — drop oldest
    try {
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify([session]));
    } catch {
      // Can't write at all
    }
  }
}

export function updateSessionFeedback(
  sessionId: string,
  feedback: {
    userReportedCount?: number | null;
    countAccuracyRating?: "accurate" | "overcounted" | "undercounted" | null;
    feedbackNote?: string;
  }
): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(TELEMETRY_KEY);
    if (!stored) return;
    const sessions: SessionTelemetry[] = JSON.parse(stored);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      if (feedback.userReportedCount !== undefined)
        session.userReportedCount = feedback.userReportedCount;
      if (feedback.countAccuracyRating !== undefined)
        session.countAccuracyRating = feedback.countAccuracyRating;
      if (feedback.feedbackNote !== undefined)
        session.feedbackNote = feedback.feedbackNote;
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify(sessions));
    }
  } catch {
    // ignore
  }
}

export function getTelemetrySessions(userId?: string): SessionTelemetry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(TELEMETRY_KEY);
    if (!stored) return [];
    const sessions: SessionTelemetry[] = JSON.parse(stored);
    if (userId) return sessions.filter((s) => s.userId === userId);
    return sessions;
  } catch {
    return [];
  }
}

/**
 * Analyze telemetry data to suggest threshold adjustments.
 * This is the "learning" part — looks at sessions where users
 * reported inaccurate counts and suggests better thresholds.
 */
export function suggestThresholdAdjustments(userId: string): {
  suggestion: string;
  adjustedDown?: number;
  adjustedUp?: number;
} | null {
  const sessions = getTelemetrySessions(userId).filter(
    (s) => s.countAccuracyRating !== null && s.countAccuracyRating !== "accurate"
  );

  if (sessions.length < 2) return null;

  const overcounted = sessions.filter((s) => s.countAccuracyRating === "overcounted");
  const undercounted = sessions.filter((s) => s.countAccuracyRating === "undercounted");

  if (overcounted.length > undercounted.length) {
    // Tighten thresholds — make it harder to count a rep
    const avgDown = overcounted.reduce((s, x) => s + x.thresholdsUsed.elbowDownAngle, 0) / overcounted.length;
    return {
      suggestion: "Detection seems too sensitive. Tightening thresholds to require deeper reps.",
      adjustedDown: Math.round(avgDown - 10),
      adjustedUp: undefined,
    };
  }

  if (undercounted.length > overcounted.length) {
    // Loosen thresholds — make it easier to count a rep
    const avgDown = undercounted.reduce((s, x) => s + x.thresholdsUsed.elbowDownAngle, 0) / undercounted.length;
    const avgUp = undercounted.reduce((s, x) => s + x.thresholdsUsed.elbowUpAngle, 0) / undercounted.length;
    return {
      suggestion: "Detection may be missing some reps. Loosening thresholds.",
      adjustedDown: Math.round(avgDown + 8),
      adjustedUp: Math.round(avgUp - 5),
    };
  }

  return null;
}

/**
 * Export all telemetry as JSON (for future Firebase sync).
 */
export function exportTelemetry(): string {
  const sessions = getTelemetrySessions();
  return JSON.stringify(sessions, null, 2);
}
