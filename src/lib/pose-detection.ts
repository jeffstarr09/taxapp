import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";
import { PoseKeypoint } from "@/types";

let detector: poseDetection.PoseDetector | null = null;
let isInitializing = false;

export async function initPoseDetector(): Promise<poseDetection.PoseDetector> {
  if (detector) return detector;
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (detector) return detector;
  }

  isInitializing = true;
  try {
    await tf.setBackend("webgl");
    await tf.ready();

    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25,
      }
    );
    return detector;
  } finally {
    isInitializing = false;
  }
}

export async function detectPose(
  video: HTMLVideoElement
): Promise<PoseKeypoint[]> {
  const det = await initPoseDetector();
  const poses = await det.estimatePoses(video, {
    flipHorizontal: false,
  });

  if (poses.length === 0 || !poses[0].keypoints) return [];

  return poses[0].keypoints.map((kp) => ({
    x: kp.x,
    y: kp.y,
    score: kp.score || 0,
    name: kp.name || "",
  }));
}

export function getKeypointByName(
  keypoints: PoseKeypoint[],
  name: string
): PoseKeypoint | undefined {
  return keypoints.find((kp) => kp.name === name);
}

export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export function disposePoseDetector(): void {
  if (detector) {
    detector.dispose();
    detector = null;
  }
}
