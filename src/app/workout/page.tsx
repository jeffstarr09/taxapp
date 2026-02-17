"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import CameraView from "@/components/CameraView";
import WorkoutHUD from "@/components/WorkoutHUD";
import WorkoutSummary from "@/components/WorkoutSummary";
import Tutorial, { hasSeen as tutorialSeen } from "@/components/Tutorial";
import { PushupState, WorkoutSession } from "@/types";
import { getCurrentUser, saveWorkout, seedDemoData } from "@/lib/storage";
import {
  playRepSound,
  playMilestoneSound,
  playStartSound,
  playEndSound,
  triggerHaptic,
  isMilestone,
} from "@/lib/sounds";
import { resetTelemetry, finishSession, saveTelemetrySession, updateSessionFeedback } from "@/lib/telemetry";
import { getActiveAnalyzerThresholds } from "@/lib/pushup-analyzer";
import { getCalibrationProfile } from "@/lib/calibration";

export default function WorkoutPage() {
  const [isActive, setIsActive] = useState(false);
  const [pushupState, setPushupState] = useState<PushupState>({
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
  const [milestoneFlash, setMilestoneFlash] = useState<string | null>(null);
  const [telemetrySessionId, setTelemetrySessionId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    seedDemoData();
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

  const handleUpdate = useCallback((state: PushupState) => {
    setPushupState(state);
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
      if (count > 0) {
        setSessionResult({ count, duration, avgForm, timestamps });
        setShowSummary(true);
      }
    },
    []
  );

  const handleStart = () => {
    prevCountRef.current = 0;
    setPushupState({
      phase: "up",
      count: 0,
      formScore: 0,
      feedback: "",
      elbowAngle: 0,
      bodyAlignment: 0,
    });
    setSaved(false);
    setTelemetrySessionId(null);
    resetTelemetry();
    setIsActive(true);
    playStartSound();
    triggerHaptic("medium");
  };

  const handleStop = () => {
    setIsActive(false);
    playEndSound();
    triggerHaptic("medium");

    // Finalize telemetry session
    const user = getCurrentUser();
    const thresholds = getActiveAnalyzerThresholds();
    const hasCalibration = !!getCalibrationProfile(user?.id);
    const session = finishSession(
      user?.id || "anonymous",
      { elbowDownAngle: thresholds.elbowDownAngle, elbowUpAngle: thresholds.elbowUpAngle, shoulderDropThreshold: thresholds.shoulderDropThreshold },
      hasCalibration
    );
    saveTelemetrySession(session);
    setTelemetrySessionId(session.id);
  };

  const handleSave = () => {
    if (!sessionResult || saved) return;
    const user = getCurrentUser();
    const workout: WorkoutSession = {
      id: uuidv4(),
      userId: user?.id || "anonymous",
      count: sessionResult.count,
      duration: sessionResult.duration,
      averageFormScore: sessionResult.avgForm,
      timestamps: sessionResult.timestamps,
      date: new Date().toISOString(),
      verified: true,
    };
    saveWorkout(workout);
    setSaved(true);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Workout</h1>
        {isActive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-drop-600/15 text-drop-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-drop-500 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr,300px] gap-4">
        {/* Camera feed */}
        <div className="relative">
          {isActive ? (
            <CameraView
              isActive={isActive}
              onUpdate={handleUpdate}
              onSessionEnd={handleSessionEnd}
            />
          ) : (
            <div className="aspect-[4/3] drop-card rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center p-6 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-drop-600/10 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-drop-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Setup Checklist</h2>
              <p className="text-neutral-500 text-xs text-center mb-5 max-w-xs">
                Follow these steps for the most accurate push-up tracking
              </p>

              <div className="w-full max-w-sm space-y-3">
                {[
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                      </svg>
                    ),
                    title: "Distance: 4–8 feet away",
                    desc: "Prop your phone so your full body is in frame",
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    ),
                    title: "Side angle view",
                    desc: "Camera should see you from the side, not front-on",
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                    ),
                    title: "Good lighting",
                    desc: "Well-lit room — avoid backlighting or shadows on your body",
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                    ),
                    title: "Stable surface",
                    desc: "Lean your phone against something sturdy — no wobble",
                  },
                ].map((step) => (
                  <div key={step.title} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="mt-0.5 text-drop-500 shrink-0">{step.icon}</div>
                    <div>
                      <p className="text-white text-sm font-semibold">{step.title}</p>
                      <p className="text-neutral-500 text-xs mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestone flash overlay */}
          {milestoneFlash && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="px-8 py-4 bg-drop-600/90 backdrop-blur-sm rounded-2xl animate-milestone-flash">
                <p className="text-white text-3xl font-black tracking-tight">
                  {milestoneFlash}
                </p>
              </div>
            </div>
          )}

          {/* Start/Stop button */}
          <div className="mt-4 flex justify-center">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="px-14 py-4 bg-drop-600 text-white text-lg font-black rounded-xl hover:bg-drop-700 transition drop-glow uppercase tracking-wider"
              >
                Drop
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-14 py-4 bg-neutral-800 text-white text-lg font-bold rounded-xl hover:bg-neutral-700 transition border border-white/10 uppercase tracking-wider"
              >
                End
              </button>
            )}
          </div>
        </div>

        {/* HUD sidebar */}
        <div className="lg:sticky lg:top-24">
          <WorkoutHUD state={pushupState} elapsed={elapsed} isActive={isActive} />

          {!isActive && (
            <div className="mt-4 drop-card rounded-xl p-4">
              <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Tips</h3>
              <ul className="text-neutral-500 text-xs space-y-2">
                {[
                  "Side-angle camera works best",
                  "Ensure full body is in frame",
                  "Good lighting improves accuracy",
                  "Go all the way down & up",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="text-drop-500 mt-0.5 text-[10px]">&#x25CF;</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showSummary && sessionResult && (
        <WorkoutSummary
          count={sessionResult.count}
          duration={sessionResult.duration}
          averageForm={sessionResult.avgForm}
          onClose={handleCloseSummary}
          onSave={handleSave}
          saved={saved}
          onFeedback={handleFeedback}
        />
      )}

      {showTutorial && (
        <Tutorial onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
