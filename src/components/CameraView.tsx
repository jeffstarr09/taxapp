"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { detectPose, initPoseDetector } from "@/lib/pose-detection";
import { analyzePushup, resetAnalyzer, getAverageFormScore, getRepTimestamps } from "@/lib/pushup-analyzer";
import { PoseKeypoint, PushupState } from "@/types";

interface CameraViewProps {
  isActive: boolean;
  onUpdate: (state: PushupState) => void;
  onSessionEnd: (count: number, duration: number, avgForm: number, timestamps: number[]) => void;
}

const SKELETON_CONNECTIONS: [string, string][] = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

/**
 * Draws a side-view pushup silhouette outline on the canvas.
 * Shown briefly when tracking starts so users know where to position.
 */
function drawPositionGuide(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();

  // Semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, w, h);

  // Pushup silhouette (side view, person in "up" position)
  // Scaled proportionally to canvas size
  const scale = Math.min(w / 640, h / 480);
  const cx = w / 2;
  const baseY = h * 0.55;

  ctx.strokeStyle = "rgba(220, 38, 38, 0.6)";
  ctx.lineWidth = 2.5 * scale;
  ctx.setLineDash([8 * scale, 6 * scale]);

  // Body line from hands -> shoulders -> hips -> ankles (side view plank)
  const bodyLen = w * 0.6;
  const startX = cx - bodyLen / 2;
  const endX = cx + bodyLen / 2;

  // Hands (wrists on ground)
  const handY = baseY + 30 * scale;
  // Shoulders (above hands)
  const shoulderX = startX + bodyLen * 0.2;
  const shoulderY = baseY - 20 * scale;
  // Hips
  const hipX = startX + bodyLen * 0.55;
  const hipY = baseY - 15 * scale;
  // Ankles
  const ankleX = endX;
  const ankleY = baseY + 5 * scale;

  // Arms (wrist -> elbow -> shoulder)
  ctx.beginPath();
  ctx.moveTo(startX, handY);
  ctx.lineTo(startX + bodyLen * 0.08, baseY - 5 * scale); // elbow
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Torso (shoulder -> hip)
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(hipX, hipY);
  ctx.stroke();

  // Legs (hip -> knee -> ankle)
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(startX + bodyLen * 0.75, baseY);
  ctx.lineTo(ankleX, ankleY);
  ctx.stroke();

  // Head circle
  ctx.beginPath();
  ctx.arc(shoulderX - 15 * scale, shoulderY - 15 * scale, 12 * scale, 0, Math.PI * 2);
  ctx.stroke();

  // Joint dots
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(220, 38, 38, 0.5)";
  const joints = [
    [startX, handY],
    [startX + bodyLen * 0.08, baseY - 5 * scale],
    [shoulderX, shoulderY],
    [hipX, hipY],
    [startX + bodyLen * 0.75, baseY],
    [ankleX, ankleY],
  ];
  joints.forEach(([jx, jy]) => {
    ctx.beginPath();
    ctx.arc(jx, jy, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  });

  // Label
  ctx.font = `${14 * scale}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.textAlign = "center";
  ctx.fillText("Align your body like this", cx, h * 0.85);

  ctx.font = `${11 * scale}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillText("Side view — full body in frame", cx, h * 0.85 + 18 * scale);

  ctx.restore();
}

export default function CameraView({ isActive, onUpdate, onSessionEnd }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastCountRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [poseDetected, setPoseDetected] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const poseDetectedFrames = useRef(0);

  // Draw guide when camera is ready
  useEffect(() => {
    if (!loading && showGuide && guideCanvasRef.current && videoRef.current) {
      const canvas = guideCanvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) drawPositionGuide(ctx, canvas.width, canvas.height);
    }
  }, [loading, showGuide]);

  // Auto-hide guide after pose is steadily detected
  useEffect(() => {
    if (poseDetected && showGuide) {
      const timeout = setTimeout(() => setShowGuide(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [poseDetected, showGuide]);

  const drawKeypoints = useCallback((keypoints: PoseKeypoint[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = videoRef.current;
    if (!video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw skeleton connections in red
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#dc2626";
    ctx.shadowBlur = 8;
    SKELETON_CONNECTIONS.forEach(([from, to]) => {
      const fromKp = keypoints.find((kp) => kp.name === from);
      const toKp = keypoints.find((kp) => kp.name === to);
      if (fromKp && toKp && fromKp.score > 0.3 && toKp.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(fromKp.x, fromKp.y);
        ctx.lineTo(toKp.x, toKp.y);
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;

    // Draw keypoints
    keypoints.forEach((kp) => {
      if (kp.score > 0.3) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = kp.score > 0.6 ? "#ffffff" : "#fca5a5";
        ctx.fill();
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Track if pose is detected reliably (for guide auto-hide)
    const confidentPoints = keypoints.filter((kp) => kp.score > 0.3).length;
    if (confidentPoints >= 8) {
      poseDetectedFrames.current++;
      if (poseDetectedFrames.current > 15) {
        setPoseDetected(true);
      }
    } else {
      poseDetectedFrames.current = Math.max(0, poseDetectedFrames.current - 2);
    }
  }, []);

  const detect = useCallback(async () => {
    if (!isActive || !videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    try {
      const keypoints = await detectPose(videoRef.current);
      if (keypoints.length > 0 && canvasRef.current) {
        drawKeypoints(keypoints, canvasRef.current);
        const pushupState = analyzePushup(keypoints);
        onUpdate(pushupState);
        lastCountRef.current = pushupState.count;
        setDisplayCount(pushupState.count);
      }
    } catch {
      // Silently continue on detection errors
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, [isActive, onUpdate, drawKeypoints]);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowGuide(true);
    setPoseDetected(false);
    poseDetectedFrames.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      await initPoseDetector();
      setLoading(false);
      startTimeRef.current = Date.now();
      resetAnalyzer();
      lastCountRef.current = 0;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("Permission")
            ? "Camera access denied. Allow camera access to track push-ups."
            : `Camera error: ${err.message}`
          : "Failed to access camera"
      );
      setLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      const duration = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;
      if (lastCountRef.current > 0) {
        onSessionEnd(
          lastCountRef.current,
          duration,
          getAverageFormScore(),
          getRepTimestamps()
        );
      }
      stopCamera();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (isActive && !loading && !error) {
      detect();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, loading, error, detect]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-neutral-900 rounded-2xl p-8 border border-white/5">
        <div className="text-drop-400 text-lg mb-4 text-center">{error}</div>
        <button
          onClick={startCamera}
          className="px-6 py-3 bg-drop-600 text-white rounded-xl hover:bg-drop-700 transition font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/5">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90">
          <div className="w-12 h-12 border-3 border-drop-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg font-medium">Loading AI model...</p>
          <p className="text-neutral-500 text-sm mt-2">First load takes a moment</p>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ transform: "scaleX(-1)" }}
      />
      {/* Position guide overlay */}
      {showGuide && !loading && (
        <canvas
          ref={guideCanvasRef}
          className="absolute inset-0 w-full h-full z-10 transition-opacity duration-500"
          style={{
            transform: "scaleX(-1)",
            opacity: poseDetected ? 0 : 1,
          }}
        />
      )}
      {/* Rep counter overlay — always visible top-left corner */}
      {!loading && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
            <span className="text-white text-3xl font-black tabular-nums drop-text-glow">
              {displayCount}
            </span>
            <span className="text-neutral-400 text-xs ml-1.5 uppercase tracking-wider">reps</span>
          </div>
        </div>
      )}
    </div>
  );
}
