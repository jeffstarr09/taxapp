"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import CameraView from "@/components/CameraView";
import WorkoutHUD from "@/components/WorkoutHUD";
import WorkoutSummary from "@/components/WorkoutSummary";
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    seedDemoData();
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
    setIsActive(true);
    playStartSound();
    triggerHaptic("medium");
  };

  const handleStop = () => {
    setIsActive(false);
    playEndSound();
    triggerHaptic("medium");
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
            <div className="aspect-[4/3] drop-card rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-drop-600/10 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-drop-500"
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
              <h2 className="text-lg font-bold text-white mb-2">Ready?</h2>
              <p className="text-neutral-500 text-sm text-center mb-1">
                Position your device so your full body is visible from the side.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["4-8 feet away", "Good lighting", "Side angle"].map((tip) => (
                  <span key={tip} className="px-3 py-1 bg-white/5 rounded-full text-neutral-400 text-xs">
                    {tip}
                  </span>
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
        />
      )}
    </div>
  );
}
