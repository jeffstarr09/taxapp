"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import CameraView from "@/components/CameraView";
import WorkoutHUD from "@/components/WorkoutHUD";
import WorkoutSummary from "@/components/WorkoutSummary";
import { PushupState, WorkoutSession } from "@/types";
import { getCurrentUser, saveWorkout, seedDemoData } from "@/lib/storage";

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    seedDemoData();
  }, []);

  // Timer
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
    // Flash animation on new rep
    if (state.count > prevCountRef.current) {
      prevCountRef.current = state.count;
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
  };

  const handleStop = () => {
    setIsActive(false);
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Workout</h1>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Camera feed */}
        <div>
          {isActive ? (
            <CameraView
              isActive={isActive}
              onUpdate={handleUpdate}
              onSessionEnd={handleSessionEnd}
            />
          ) : (
            <div className="aspect-[4/3] bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-8">
              <svg
                className="w-20 h-20 text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-300 mb-2">
                Ready to Start?
              </h2>
              <p className="text-gray-500 text-center mb-2">
                Position your device so your full body is visible from the side.
              </p>
              <ul className="text-gray-500 text-sm space-y-1 mb-6">
                <li>&#x2022; Place your device 4-8 feet away</li>
                <li>&#x2022; Ensure good lighting</li>
                <li>&#x2022; Side angle works best</li>
              </ul>
            </div>
          )}

          {/* Start/Stop button */}
          <div className="mt-4 flex justify-center">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="px-12 py-4 bg-blue-600 text-white text-xl font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
              >
                Start Workout
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-12 py-4 bg-red-600 text-white text-xl font-bold rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-600/25"
              >
                End Workout
              </button>
            )}
          </div>
        </div>

        {/* HUD sidebar */}
        <div className="lg:sticky lg:top-24">
          <WorkoutHUD state={pushupState} elapsed={elapsed} isActive={isActive} />

          {/* Tips when not active */}
          {!isActive && (
            <div className="mt-4 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-white font-semibold mb-2">Tips for Accuracy</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">&#x2713;</span>
                  Use a side-angle camera position
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">&#x2713;</span>
                  Ensure your full body is in frame
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">&#x2713;</span>
                  Good lighting improves detection
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">&#x2713;</span>
                  Go all the way down and all the way up
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Summary modal */}
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
