"use client";

import { useState } from "react";

const TUTORIAL_KEY = "drop_tutorial_seen";

export function hasSeen(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TUTORIAL_KEY) === "true";
}

export function markSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TUTORIAL_KEY, "true");
}

interface TutorialProps {
  onComplete: () => void;
}

interface Step {
  title: string;
  subtitle: string;
  bullets: { label: string; detail: string }[];
}

const STEPS: Step[] = [
  {
    title: "Welcome to DROP",
    subtitle: "AI-powered pushup counter",
    bullets: [
      {
        label: "Counts every rep automatically",
        detail:
          "Your phone's camera + on-device AI track your body and count reps in real time. No wearables, no taps.",
      },
      {
        label: "Grades your form",
        detail:
          "Every rep is scored on elbow depth and body alignment, so you know if you're going all the way down.",
      },
      {
        label: "Nothing leaves your phone",
        detail:
          "Pose detection runs locally in your browser. Video never uploads — only your final rep count and form score.",
      },
    ],
  },
  {
    title: "Set up your phone",
    subtitle: "Side angle, full body visible",
    bullets: [
      {
        label: "Lean the phone against something stable",
        detail:
          "A water bottle, a shoe, or a stack of books works. It needs to stay put while you move.",
      },
      {
        label: "4 to 8 feet away, at a side angle",
        detail:
          "Turn the phone sideways so the camera sees your profile — head, shoulders, hips, and ankles all in frame.",
      },
      {
        label: "Good lighting helps accuracy",
        detail:
          "Face a window or overhead lamp. Avoid shooting toward a bright window behind you.",
      },
    ],
  },
  {
    title: "Line up with the guide",
    subtitle: "A body outline will appear",
    bullets: [
      {
        label: "Match the cyan silhouette",
        detail:
          "When you start, a pushup outline appears on screen. Position yourself inside it in a plank.",
      },
      {
        label: "Hold steady for a moment",
        detail:
          "Once the AI locks onto your full body and elbow angle, the guide fades away and counting begins.",
      },
      {
        label: "Can't see your ankles? Move the phone back",
        detail:
          "The counter won't start until your whole body is in frame — that's how we block half-reps and knee pushups.",
      },
    ],
  },
  {
    title: "Crush your set",
    subtitle: "Full range of motion counts",
    bullets: [
      {
        label: "Go all the way down",
        detail:
          "Chest near the floor, elbows past 90°. Half-reps don't count and they tank your form score.",
      },
      {
        label: "Fully extend at the top",
        detail:
          "Lock out your arms between reps. That's how the counter knows one rep is finished and the next is starting.",
      },
      {
        label: "Listen for the beep",
        detail:
          "You'll hear a sound and feel a haptic on every rep counted, plus a bigger cue every 10 reps.",
      },
    ],
  },
  {
    title: "You're ready",
    subtitle: "Tap Start Workout to begin",
    bullets: [
      {
        label: "Your count and timer show in the corner",
        detail:
          "Stay focused on the workout — glance at the HUD only if you need to.",
      },
      {
        label: "Tap End when you're done",
        detail:
          "You'll see your rep count, total time, average form score, and where you land on the leaderboard.",
      },
      {
        label: "Compete with friends",
        detail:
          "Add friends from the Leaderboard tab and watch your rank climb as you keep logging workouts.",
      },
    ],
  },
];

export default function Tutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      markSeen();
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    markSeen();
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-xl flex flex-col max-h-[92vh]">
        {/* Workout setup illustration — same image used on the workout setup page */}
        <div className="bg-[#f7f7f7] px-6 pt-8 pb-4">
          <img
            src="/workout-setup.png"
            alt="Pushup position in phone"
            className="w-full h-auto object-contain max-h-44 mx-auto"
          />
        </div>

        {/* Scrollable content area so long bullet lists never get clipped */}
        <div className="px-6 pt-5 pb-6 overflow-y-auto">
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-[#e8450a]"
                    : i < step
                      ? "w-1.5 bg-[#e8450a]/40"
                      : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Title */}
          <p className="text-[#e8450a] text-[10px] uppercase tracking-[0.18em] font-bold text-center mb-1">
            {current.subtitle}
          </p>
          <h2 className="text-2xl font-black text-gray-900 text-center mb-5">
            {current.title}
          </h2>

          {/* Bullet points — icon + label + detail */}
          <ul className="space-y-3.5 mb-6">
            {current.bullets.map((b, i) => (
              <li key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e8450a]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-[#e8450a]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm leading-snug">
                    {b.label}
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed mt-0.5">
                    {b.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex gap-3">
            {!isLast && (
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className={`${isLast ? "w-full" : "flex-1"} px-4 py-3 bg-[#e8450a] text-white rounded-xl hover:bg-[#d03e09] transition font-bold text-sm`}
            >
              {isLast ? "Start Workout" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
