import { PoseKeypoint, ExerciseType } from "@/types";
import { createClient } from "@/lib/supabase";
import { debugLog, debugError } from "@/lib/debug-log";

const KEYPOINT_NAMES = [
  "nose", "left_eye", "right_eye", "left_ear", "right_ear",
  "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_wrist", "right_wrist", "left_hip", "right_hip",
  "left_knee", "right_knee", "left_ankle", "right_ankle",
];

interface CaptureState {
  frames: number[][]; // each frame = flat array of 51 values (17 keypoints × 3)
  startTime: number;
  frameTimestamps: number[];
}

let capture: CaptureState | null = null;

export function startCapture(): void {
  capture = {
    frames: [],
    startTime: Date.now(),
    frameTimestamps: [],
  };
}

export function recordKeypoints(keypoints: PoseKeypoint[]): void {
  if (!capture) return;

  // Build a flat array: [x0, y0, s0, x1, y1, s1, ...] in canonical keypoint order
  const frame: number[] = new Array(51).fill(0);
  for (const kp of keypoints) {
    const idx = KEYPOINT_NAMES.indexOf(kp.name);
    if (idx >= 0) {
      frame[idx * 3] = Math.round(kp.x * 10) / 10;
      frame[idx * 3 + 1] = Math.round(kp.y * 10) / 10;
      frame[idx * 3 + 2] = Math.round(kp.score * 100) / 100;
    }
  }

  capture.frames.push(frame);
  capture.frameTimestamps.push(Date.now() - capture.startTime);
}

export function stopCapture(): {
  frames: number[][];
  durationMs: number;
  frameCount: number;
  fps: number;
} | null {
  if (!capture || capture.frames.length === 0) return null;

  const durationMs = Date.now() - capture.startTime;
  const frameCount = capture.frames.length;
  const fps = durationMs > 0 ? Math.round((frameCount / durationMs) * 1000) : 30;

  const result = {
    frames: capture.frames,
    durationMs,
    frameCount,
    fps,
  };

  capture = null;
  return result;
}

export async function uploadSequence(
  userId: string,
  workoutId: string | undefined,
  exerciseType: ExerciseType,
  reportedCount: number,
  captureData: {
    frames: number[][];
    durationMs: number;
    frameCount: number;
    fps: number;
  }
): Promise<void> {
  try {
    const supabase = createClient();

    const deviceInfo = {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
    };

    const { error } = await supabase.from("workout_sequences").insert({
      user_id: userId,
      workout_id: workoutId || null,
      exercise_type: exerciseType,
      fps: captureData.fps,
      duration_ms: captureData.durationMs,
      frame_count: captureData.frameCount,
      reported_count: reportedCount,
      keypoints: captureData.frames,
      device_info: deviceInfo,
    });

    if (error) {
      debugError("Sequence upload failed", { code: error.code, message: error.message });
    } else {
      debugLog("Sequence uploaded", {
        frames: captureData.frameCount,
        fps: captureData.fps,
        exerciseType,
        reportedCount,
      });
    }
  } catch (err) {
    debugError("Sequence upload error", { error: err instanceof Error ? err.message : String(err) });
  }
}
