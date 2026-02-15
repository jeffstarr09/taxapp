"use client";

import { useState } from "react";

interface WorkoutSummaryProps {
  count: number;
  duration: number;
  averageForm: number;
  onClose: () => void;
  onSave: () => void;
  saved: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getGrade(form: number): { grade: string; color: string; message: string } {
  if (form >= 90) return { grade: "A+", color: "text-green-400", message: "Perfect form. Machine status." };
  if (form >= 80) return { grade: "A", color: "text-green-400", message: "Excellent form. Keep it up." };
  if (form >= 70) return { grade: "B", color: "text-white", message: "Great job. Minor tweaks possible." };
  if (form >= 60) return { grade: "C", color: "text-yellow-400", message: "Solid effort. Focus on alignment." };
  if (form >= 50) return { grade: "D", color: "text-orange-400", message: "Keep practicing. Form needs work." };
  return { grade: "F", color: "text-drop-400", message: "Slow down. Focus on form." };
}

function getShareText(count: number, grade: string): string {
  return `I just dropped ${count} push-ups and scored ${grade} form on DROP — the AI push-up counter. Think you can beat that?`;
}

export default function WorkoutSummary({ count, duration, averageForm, onClose, onSave, saved }: WorkoutSummaryProps) {
  const gradeInfo = getGrade(averageForm);
  const repsPerMinute = duration > 0 ? ((count / duration) * 60).toFixed(1) : "0";
  const [shared, setShared] = useState(false);

  const shareText = getShareText(count, gradeInfo.grade);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DROP — ${count} Push-ups`,
          text: shareText,
        });
        setShared(true);
      } catch (e) {
        // User cancelled or share failed, fall back to Twitter
        handleShareTwitter();
      }
    } else {
      handleShareTwitter();
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=550,height=420");
    setShared(true);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="drop-card rounded-3xl p-8 max-w-md w-full drop-glow">
        {/* Header */}
        <div className="text-center mb-2">
          <p className="text-neutral-500 text-xs uppercase tracking-[0.3em] font-medium">Workout Complete</p>
        </div>

        <div className="red-line my-4" />

        {/* Big count */}
        <div className="text-center mb-8">
          <p className="text-[7rem] leading-none font-black text-white tracking-tighter drop-text-glow">{count}</p>
          <p className="text-neutral-400 text-sm uppercase tracking-[0.2em] mt-2">push-ups</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center">
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest mb-1">Duration</p>
            <p className="text-xl font-bold text-white">{formatTime(duration)}</p>
          </div>
          <div className="text-center">
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest mb-1">Grade</p>
            <p className={`text-xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</p>
          </div>
          <div className="text-center">
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest mb-1">Pace</p>
            <p className="text-xl font-bold text-white">{repsPerMinute}<span className="text-sm text-neutral-500">/m</span></p>
          </div>
        </div>

        {/* Form bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-neutral-500 uppercase tracking-wider">Form</span>
            <span className={gradeInfo.color}>{averageForm}%</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-drop-600 to-white rounded-full transition-all"
              style={{ width: `${averageForm}%` }}
            />
          </div>
          <p className="text-neutral-500 text-xs mt-2 text-center">{gradeInfo.message}</p>
        </div>

        {/* AI Verified badge */}
        <div className="flex items-center justify-center gap-2 mb-6 py-2.5 px-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <svg className="w-4 h-4 text-drop-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="text-neutral-400 text-xs font-medium">AI-Verified</span>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-neutral-200 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
            </svg>
            {shared ? "Shared!" : "Share"}
          </button>
          <button
            onClick={handleShareTwitter}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 text-white rounded-xl font-bold text-sm hover:bg-neutral-700 transition"
            title="Share on X"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 text-white rounded-xl font-bold text-sm hover:bg-neutral-700 transition"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-white/10 text-neutral-400 rounded-xl hover:bg-white/5 transition font-medium text-sm"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={saved}
            className="flex-1 px-4 py-3 bg-drop-600 text-white rounded-xl hover:bg-drop-700 transition font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? "Saved" : "Save Result"}
          </button>
        </div>
      </div>
    </div>
  );
}
