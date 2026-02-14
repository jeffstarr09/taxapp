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
  return "text-red-400";
}

function getFormBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getPhaseIndicator(phase: string): { label: string; color: string } {
  switch (phase) {
    case "down":
      return { label: "DOWN", color: "bg-blue-500" };
    case "up":
      return { label: "UP", color: "bg-green-500" };
    default:
      return { label: "MOVING", color: "bg-yellow-500" };
  }
}

export default function WorkoutHUD({ state, elapsed, isActive }: WorkoutHUDProps) {
  const phaseInfo = getPhaseIndicator(state.phase);

  return (
    <div className="space-y-4">
      {/* Main counter */}
      <div className="bg-gray-800/90 backdrop-blur rounded-2xl p-6 text-center">
        <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Push-ups</p>
        <p className="text-7xl font-bold text-white tabular-nums">{state.count}</p>
        {isActive && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${phaseInfo.color} animate-pulse`} />
            <span className="text-gray-400 text-sm">{phaseInfo.label}</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/90 backdrop-blur rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Time</p>
          <p className="text-2xl font-semibold text-white tabular-nums">
            {formatTime(elapsed)}
          </p>
        </div>
        <div className="bg-gray-800/90 backdrop-blur rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Form</p>
          <p className={`text-2xl font-semibold ${getFormColor(state.formScore)} tabular-nums`}>
            {state.formScore > 0 ? `${state.formScore}%` : "—"}
          </p>
        </div>
      </div>

      {/* Form bar */}
      {state.formScore > 0 && (
        <div className="bg-gray-800/90 backdrop-blur rounded-xl p-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Form Quality</span>
            <span>{state.formScore}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getFormBgColor(state.formScore)} rounded-full transition-all duration-300`}
              style={{ width: `${state.formScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Feedback */}
      {isActive && state.feedback && (
        <div className="bg-gray-800/90 backdrop-blur rounded-xl p-4">
          <p className="text-gray-300 text-sm text-center">{state.feedback}</p>
        </div>
      )}

      {/* Elbow angle debug (subtle) */}
      {isActive && state.elbowAngle > 0 && (
        <div className="bg-gray-800/60 rounded-xl p-3 flex justify-between text-xs text-gray-500">
          <span>Elbow: {state.elbowAngle}°</span>
          <span>Body: {state.bodyAlignment}°</span>
        </div>
      )}
    </div>
  );
}
