"use client";

import { PushupState } from "@/types";

interface WorkoutHUDProps {
  state: PushupState;
  elapsed: number;
  isActive: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getFormColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-drop-400";
}

function getFormBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-drop-500";
}

function getPhaseClass(phase: string): string {
  switch (phase) {
    case "down":
      return "phase-down";
    case "up":
      return "phase-up";
    default:
      return "phase-transition";
  }
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case "down":
      return "DOWN";
    case "up":
      return "UP";
    default:
      return "MOVING";
  }
}

export default function WorkoutHUD({ state, elapsed, isActive }: WorkoutHUDProps) {
  return (
    <div className="space-y-3">
      {/* Main counter */}
      <div className="drop-card rounded-2xl p-6 text-center">
        <p className="text-neutral-500 text-xs uppercase tracking-[0.2em] font-medium mb-2">Reps</p>
        <p className="text-8xl font-black text-white tabular-nums tracking-tighter drop-text-glow">
          {state.count}
        </p>
        {isActive && (
          <div className="mt-3 flex items-center justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getPhaseClass(state.phase)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {getPhaseLabel(state.phase)}
            </span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="drop-card rounded-xl p-4 text-center">
          <p className="text-neutral-500 text-xs uppercase tracking-[0.15em] mb-1">Time</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {formatTime(elapsed)}
          </p>
        </div>
        <div className="drop-card rounded-xl p-4 text-center">
          <p className="text-neutral-500 text-xs uppercase tracking-[0.15em] mb-1">Form</p>
          <p className={`text-2xl font-bold ${getFormColor(state.formScore)} tabular-nums`}>
            {state.formScore > 0 ? `${state.formScore}%` : "--"}
          </p>
        </div>
      </div>

      {/* Form bar */}
      {state.formScore > 0 && (
        <div className="drop-card rounded-xl p-4">
          <div className="flex justify-between text-xs text-neutral-500 mb-2">
            <span className="uppercase tracking-wider">Form Quality</span>
            <span className="font-medium text-white">{state.formScore}%</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getFormBarColor(state.formScore)} rounded-full transition-all duration-300`}
              style={{ width: `${state.formScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Feedback */}
      {isActive && state.feedback && (
        <div className="drop-card rounded-xl p-4">
          <p className="text-neutral-300 text-sm text-center font-medium">{state.feedback}</p>
        </div>
      )}

      {/* Debug angles */}
      {isActive && state.elbowAngle > 0 && (
        <div className="flex justify-between text-[10px] text-neutral-600 px-1 font-mono">
          <span>Elbow {state.elbowAngle}&deg;</span>
          <span>Body {state.bodyAlignment}&deg;</span>
        </div>
      )}
    </div>
  );
}
