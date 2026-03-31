"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { detectPose, initPoseDetector } from "@/lib/pose-detection";
import { analyzePushup, resetAnalyzer, getAverageFormScore, getRepTimestamps } from "@/lib/pushup-analyzer";
import { PoseKeypoint, ExerciseState } from "@/types";

interface CameraViewProps {
  isActive: boolean;
  onUpdate: (state: ExerciseState) => void;
  onSessionEnd: (count: number, duration: number, avgForm: number, timestamps: number[]) => void;
  fullscreen?: boolean;
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

export default function CameraView({ isActive, onUpdate, onSessionEnd, fullscreen }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastCountRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [poseDetected, setPoseDetected] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const poseDetectedFrames = useRef(0);

  // Track orientation to counter-rotate the guide image
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", () => {
      // Delay check to let dimensions update after orientation change
      setTimeout(checkOrientation, 100);
    });
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Auto-hide guide only when pose is reliably detected
  useEffect(() => {
    if (poseDetected && showGuide) {
      setShowGuide(false);
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
          facingMode: { exact: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }).catch(() => {
        // Fallback if exact "user" fails (some devices don't support it)
        return navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
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
            ? "Camera access denied. Allow camera access to track your workout."
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
    <div className={`relative bg-black overflow-hidden ${fullscreen ? "w-full h-full" : "w-full aspect-[4/3] rounded-2xl border border-white/5"}`}>
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
      {/* Position guide overlay — counter-rotates so image always looks the same */}
      {showGuide && !loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 overflow-hidden">
          <img
            src="/pushup-guide.png"
            alt="Align with the guide to start tracking push-ups"
            style={
              isLandscape
                ? { width: "80%", maxHeight: "90%" }
                : { transform: "rotate(90deg)", height: "80vw", width: "auto", maxWidth: "none" }
            }
            className="object-contain"
          />
        </div>
      )}
      {/* Rep counter overlay — only shown in non-fullscreen mode (fullscreen has its own HUD) */}
      {!loading && !fullscreen && (
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
