"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import CameraView from "@/components/CameraView";
import WorkoutHUD from "@/components/WorkoutHUD";
import WorkoutSummary from "@/components/WorkoutSummary";
import Tutorial, { hasSeen as tutorialSeen } from "@/components/Tutorial";
import { ExerciseState, ExerciseType, WorkoutSession } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { saveWorkout } from "@/lib/storage";
import {
  playRepSound,
  playMilestoneSound,
  playStartSound,
  playEndSound,
  triggerHaptic,
  isMilestone,
} from "@/lib/sounds";
import { storePendingWorkout } from "@/lib/pending-workout";
import { resetTelemetry, finishSession, saveTelemetrySession, updateSessionFeedback } from "@/lib/telemetry";
import { startCapture, stopCapture, uploadSequence } from "@/lib/keypoint-capture";
import { getActiveAnalyzerThresholds, getAverageFormScore, getRepTimestamps } from "@/lib/pushup-analyzer";
import { debugLog, debugError } from "@/lib/debug-log";
import { getCalibrationProfile } from "@/lib/calibration";
import { trackWorkoutEvent, trackEvent } from "@/lib/analytics";
import { getExerciseConfig, getAvailableExercises } from "@/lib/exercise-config";

function getFormLabel(score: number): { text: string; color: string } {
  if (score >= 70) return { text: "Perfect", color: "text-green-400" };
  if (score >= 40) return { text: "Good Position", color: "text-yellow-400" };
  return { text: "Not In Position", color: "text-drop-400" };
}

export default function WorkoutPage() {
  const { profile } = useAuth();
  const [exerciseType, setExerciseType] = useState<ExerciseType>("pushup");
  const [isActive, setIsActive] = useState(false);
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    phase: "up",
    count: 0,
    formScore: 0,
    feedback: "",
    elbowAngle: 0,
    bodyAlignment: 0,
  });
  const [elapsed, setElapsed] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionResult, setSessionResult] = useState<{
    count: number;
    duration: number;
    avgForm: number;
    timestamps: number[];
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [milestoneFlash, setMilestoneFlash] = useState<string | null>(null);
  const [telemetrySessionId, setTelemetrySessionId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef = useRef(0);

  const exerciseConfig = getExerciseConfig(exerciseType);
  const availableExercises = getAvailableExercises();

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Toggle body class to hide navbar/layout when workout is active
  useEffect(() => {
    if (isActive) {
      document.body.classList.add("workout-active");
    } else {
      document.body.classList.remove("workout-active");
    }
    return () => {
      document.body.classList.remove("workout-active");
    };
  }, [isActive]);

  useEffect(() => {
    if (!tutorialSeen()) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const handleUpdate = useCallback((state: ExerciseState) => {
    setExerciseState(state);
    if (state.count > prevCountRef.current) {
      prevCountRef.current = state.count;

      // Sound + haptic on every rep
      playRepSound();
      triggerHaptic("light");

      // Extra feedback on milestones
      if (isMilestone(state.count)) {
        playMilestoneSound();
        triggerHaptic("heavy");
        setMilestoneFlash(`${state.count} reps!`);
        setTimeout(() => setMilestoneFlash(null), 2000);
      }
    }
  }, []);

  const handleSessionEnd = useCallback(
    (count: number, duration: number, avgForm: number, timestamps: number[]) => {
      debugLog("CameraView onSessionEnd fired", { count, duration, avgForm });
      // Only set if not already captured by handleStop
      if (count > 0 && !sessionResult) {
        setSessionResult({ count, duration, avgForm, timestamps });
        setShowSummary(true);
      }
    },
    [sessionResult]
  );

  const isGuest = !profile?.id;

  // Auto-save workout when session result is available
  useEffect(() => {
    debugLog("Save effect triggered", {
      hasResult: !!sessionResult,
      count: sessionResult?.count,
      saved,
      saving,
      hasProfile: !!profile,
      profileId: profile?.id,
    });
    if (!sessionResult || saved || saving) return;
    // Guest users: don't try to save (handled by WorkoutSummary CTA)
    if (!profile?.id) {
      debugLog("Guest user — skipping auto-save, will prompt signup");
      return;
    }

    const autoSave = async () => {
      setSaving(true);
      setSaveError(false);
      const workout: WorkoutSession = {
        id: uuidv4(),
        userId: profile.id,
        exerciseType,
        count: sessionResult.count,
        duration: sessionResult.duration,
        averageFormScore: sessionResult.avgForm,
        timestamps: sessionResult.timestamps,
        date: new Date().toISOString(),
        verified: true,
      };
      try {
        debugLog("Auto-save starting", { userId: profile.id, count: workout.count, exerciseType });
        await saveWorkout(workout);
        debugLog("Workout saved successfully!", { workoutId: workout.id });
        setSaved(true);
        trackEvent("workout_saved", {
          exerciseType,
          repCount: workout.count,
          duration: workout.duration,
          formScore: workout.averageFormScore,
        });
      } catch (err) {
        debugError("Workout save FAILED", { error: err instanceof Error ? err.message : String(err) });
        setSaveError(true);
      } finally {
        setSaving(false);
      }
    };

    autoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionResult, profile]);

  const handleStart = () => {
    prevCountRef.current = 0;
    setExerciseState({
      phase: "up",
      count: 0,
      formScore: 0,
      feedback: "",
      elbowAngle: 0,
      bodyAlignment: 0,
    });
    setSaved(false);
    setSaveError(false);
    setTelemetrySessionId(null);
    resetTelemetry();
    startCapture();
    setIsActive(true);
    playStartSound();
    triggerHaptic("medium");
    trackWorkoutEvent("started");
  };

  const handleStop = () => {
    // Capture session data BEFORE setting isActive=false, because that
    // unmounts CameraView (via the portal), killing its onSessionEnd effect.
    const count = exerciseState.count;
    if (count > 0) {
      const avgForm = getAverageFormScore();
      const timestamps = getRepTimestamps();
      debugLog("Capturing session from handleStop", { count, elapsed, avgForm, timestamps: timestamps.length });
      setSessionResult({ count, duration: elapsed, avgForm, timestamps });
      setShowSummary(true);
    }

    setIsActive(false);
    playEndSound();
    triggerHaptic("medium");

    // Upload keypoint sequence for ML training (fire-and-forget)
    const captureData = stopCapture();
    if (captureData && profile?.id && count > 0) {
      uploadSequence(profile.id, undefined, exerciseType, count, captureData);
    }

    // Finalize telemetry session
    const thresholds = getActiveAnalyzerThresholds();
    const hasCalibration = !!getCalibrationProfile(profile?.id);
    const session = finishSession(
      profile?.id || "anonymous",
      { elbowDownAngle: thresholds.elbowDownAngle, elbowUpAngle: thresholds.elbowUpAngle, shoulderDropThreshold: thresholds.shoulderDropThreshold },
      hasCalibration
    );
    saveTelemetrySession(session);
    setTelemetrySessionId(session.id);
    trackWorkoutEvent("completed", {
      exerciseType,
      repCount: exerciseState.count,
      duration: elapsed,
      formScore: exerciseState.formScore,
    });
  };

  const handleRetrySave = async () => {
    if (!sessionResult || saved || saving || !profile?.id) return;
    setSaving(true);
    setSaveError(false);
    const workout: WorkoutSession = {
      id: uuidv4(),
      userId: profile.id,
      exerciseType,
      count: sessionResult.count,
      duration: sessionResult.duration,
      averageFormScore: sessionResult.avgForm,
      timestamps: sessionResult.timestamps,
      date: new Date().toISOString(),
      verified: true,
    };
    try {
      await saveWorkout(workout);
      setSaved(true);
      trackEvent("workout_saved", {
        exerciseType,
        repCount: workout.count,
        duration: workout.duration,
        formScore: workout.averageFormScore,
      });
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSignUpToSave = () => {
    if (sessionResult) {
      storePendingWorkout({
        count: sessionResult.count,
        duration: sessionResult.duration,
        avgForm: sessionResult.avgForm,
        timestamps: sessionResult.timestamps,
        exerciseType,
        date: new Date().toISOString(),
      });
    }
    window.location.href = "/auth";
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setSessionResult(null);
  };

  const handleFeedback = (feedback: { rating: "accurate" | "overcounted" | "undercounted" }) => {
    if (telemetrySessionId) {
      updateSessionFeedback(telemetrySessionId, {
        countAccuracyRating: feedback.rating,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formLabel = getFormLabel(exerciseState.formScore);

  // ── Fullscreen active workout view — portaled to body to escape stacking context ──
  const activeWorkout = isActive && portalTarget ? createPortal(
    <div
      data-workout-overlay
      className="fixed inset-0 bg-black"
      style={{ zIndex: 99999 }}
    >
      {/* Camera fills entire screen */}
      <CameraView
        isActive={isActive}
        exerciseType={exerciseType}
        onUpdate={handleUpdate}
        onSessionEnd={handleSessionEnd}
        fullscreen
      />

      {/* Overlaid HUD — top-left: reps + time + form */}
      <div
        className="absolute left-4 flex flex-col gap-2"
        style={{ zIndex: 100000, top: "max(env(safe-area-inset-top, 0px), 16px)", paddingTop: "4px" }}
      >
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
          <span className="text-white text-4xl font-black tabular-nums drop-text-glow">
            {exerciseState.count}
          </span>
          <span className="text-neutral-400 text-xs ml-1.5 uppercase tracking-wider">reps</span>
        </div>
        <div className="flex gap-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
            <span className="text-white text-sm font-bold tabular-nums">{formatTime(elapsed)}</span>
          </div>
          {exerciseState.formScore > 0 && (
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
              <span className={`text-sm font-bold ${formLabel.color}`}>
                {formLabel.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* End button — top-right */}
      <div
        className="absolute right-4"
        style={{ zIndex: 100000, top: "max(env(safe-area-inset-top, 0px), 16px)", paddingTop: "4px" }}
      >
        <button
          onClick={handleStop}
          className="px-5 py-2.5 bg-neutral-900/80 backdrop-blur-sm text-white text-sm font-bold rounded-xl border border-white/10 hover:bg-neutral-800 transition uppercase tracking-wider"
        >
          End
        </button>
      </div>

      {/* Milestone flash overlay */}
      {milestoneFlash && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 100001 }}>
          <div className="px-8 py-4 bg-drop-600/90 backdrop-blur-sm rounded-2xl animate-milestone-flash">
            <p className="text-white text-3xl font-black tracking-tight">
              {milestoneFlash}
            </p>
          </div>
        </div>
      )}
    </div>,
    portalTarget
  ) : null;

  // WorkoutSummary — also portaled to body so it appears above everything
  const summaryPortal = showSummary && sessionResult && portalTarget ? createPortal(
    <WorkoutSummary
      count={sessionResult.count}
      duration={sessionResult.duration}
      averageForm={sessionResult.avgForm}
      exerciseType={exerciseType}
      onClose={handleCloseSummary}
      saved={saved}
      saving={saving}
      saveError={saveError}
      isGuest={isGuest}
      userId={profile?.id}
      displayName={profile?.display_name}
      onSignUp={handleSignUpToSave}
      onRetrySave={handleRetrySave}
      onFeedback={handleFeedback}
    />,
    portalTarget
  ) : null;

  // If workout is active, just render the portals (no page content visible)
  if (isActive) {
    return <>{activeWorkout}{summaryPortal}</>;
  }

  // ── Pre-workout setup view ──
  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      {/* Back link */}
      <button onClick={() => window.history.back()} className="text-gray-400 text-sm font-medium mb-6 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back
      </button>

      {/* Exercise picker */}
      {availableExercises.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {availableExercises.map((ex) => (
            <button
              key={ex.type}
              onClick={() => setExerciseType(ex.type)}
              className={`flex-1 min-w-0 py-3 px-4 rounded-xl text-sm font-bold transition border ${
                exerciseType === ex.type
                  ? "bg-[#e8450a] text-white border-[#e8450a]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {ex.labelPlural}
            </button>
          ))}
        </div>
      )}

      {/* Workout setup illustration */}
      <div className="rounded-2xl mb-8 overflow-hidden">
        <img
          src={exerciseConfig.setupImage}
          alt={`${exerciseConfig.label} position guide`}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Setup tips — dynamic per exercise */}
      <div className="space-y-5 mb-8">
        {exerciseConfig.setupTips.map((tip, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#e8450a]/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[#e8450a] font-bold text-lg">{i + 1}</span>
            </div>
            <p className="font-medium text-gray-700">{tip}</p>
          </div>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        className="w-full py-4 bg-[#dc2626] text-white text-lg font-bold rounded-2xl"
      >
        Start Workout
      </button>

      {summaryPortal}

      {showTutorial && (
        <Tutorial onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
