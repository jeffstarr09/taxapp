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

const STEPS = [
  {
    title: "Welcome to DROP",
    subtitle: "AI-powered push-up counter",
    content:
      "DROP uses your camera and AI pose detection to count your push-ups and grade your form in real time. No wearables needed.",
    icon: (
      <svg className="w-10 h-10 text-drop-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    ),
  },
  {
    title: "Camera Setup",
    subtitle: "This is the key to accuracy",
    content:
      "Place your phone 4–8 feet away at a side angle. The AI needs to see your full body from head to toe. Lean the phone against something stable.",
    icon: (
      <svg className="w-10 h-10 text-drop-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    title: "Position Guide",
    subtitle: "We'll help you line up",
    content:
      "When the camera starts, you'll see a body outline showing where to position yourself. Once the AI detects your pose, the guide fades away and tracking begins automatically.",
    icon: (
      <svg className="w-10 h-10 text-drop-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    title: "During Your Workout",
    subtitle: "Full range of motion matters",
    content:
      "Go all the way down (chest near floor) and all the way up (arms fully extended). The AI tracks your elbow angle and body alignment to count reps and score your form.",
    icon: (
      <svg className="w-10 h-10 text-drop-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    title: "You're Ready",
    subtitle: "Let's go",
    content:
      "Hit \"Drop\" to start your workout. Your rep count will appear in the corner of the camera view. When you're done, tap \"End\" to see your results and form grade.",
    icon: (
      <svg className="w-10 h-10 text-drop-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="drop-card rounded-3xl p-8 max-w-md w-full text-center">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? "w-6 bg-drop-500" : i < step ? "w-1.5 bg-drop-600" : "w-1.5 bg-neutral-700"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-drop-600/10 flex items-center justify-center">
            {current.icon}
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-black text-white mb-1">{current.title}</h2>
        <p className="text-drop-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">
          {current.subtitle}
        </p>
        <p className="text-neutral-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          {current.content}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          {!isLast && (
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 border border-white/10 text-neutral-500 rounded-xl hover:bg-white/5 transition font-medium text-sm"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${isLast ? "w-full" : "flex-1"} px-4 py-3 bg-drop-600 text-white rounded-xl hover:bg-drop-700 transition font-bold text-sm`}
          >
            {isLast ? "Start Working Out" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
