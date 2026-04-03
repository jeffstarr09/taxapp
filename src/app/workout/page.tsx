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
import { resetTelemetry, finishSession, saveTelemetrySession, updateSessionFeedback } from "@/lib/telemetry";
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
    // Cannot save without a signed-in user — Supabase RLS will reject it
    if (!profile?.id) {
      debugError("No profile.id — cannot save workout", { profile });
      setSaveError(true);
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

      {/* Workout setup illustration */}
      <div className="rounded-2xl mb-8 overflow-hidden">
        <img
          src="/workout-setup.png"
          alt="Pushup position guide — phone showing proper form"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Setup steps — vertical list */}
      <div className="space-y-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#e8450a]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#e8450a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900">Get your phone into position</p>
            <p className="text-gray-400 text-sm">Secure it at a stable angle</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#e8450a]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#e8450a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900">Side angle</p>
            <p className="text-gray-400 text-sm">Camera sees full body</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#e8450a]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#e8450a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900">Good lighting</p>
            <p className="text-gray-400 text-sm">Face a window or lamp</p>
          </div>
        </div>
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
