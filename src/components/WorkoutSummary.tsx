"use client";

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
  if (form >= 90) return { grade: "A+", color: "text-green-400", message: "Perfect form! You're a push-up machine!" };
  if (form >= 80) return { grade: "A", color: "text-green-400", message: "Excellent form! Keep it up!" };
  if (form >= 70) return { grade: "B", color: "text-blue-400", message: "Great job! Minor improvements possible." };
  if (form >= 60) return { grade: "C", color: "text-yellow-400", message: "Good effort! Focus on body alignment." };
  if (form >= 50) return { grade: "D", color: "text-orange-400", message: "Keep practicing — form needs work." };
  return { grade: "F", color: "text-red-400", message: "Try slowing down and focusing on form." };
}

export default function WorkoutSummary({ count, duration, averageForm, onClose, onSave, saved }: WorkoutSummaryProps) {
  const gradeInfo = getGrade(averageForm);
  const repsPerMinute = duration > 0 ? ((count / duration) * 60).toFixed(1) : "0";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Workout Complete!</h2>

        {/* Big count */}
        <div className="text-center mb-8">
          <p className="text-8xl font-bold text-white">{count}</p>
          <p className="text-gray-400 text-lg mt-1">push-ups</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Duration</p>
            <p className="text-xl font-semibold text-white">{formatTime(duration)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Form Grade</p>
            <p className={`text-xl font-semibold ${gradeInfo.color}`}>{gradeInfo.grade}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pace</p>
            <p className="text-xl font-semibold text-white">{repsPerMinute}/min</p>
          </div>
        </div>

        {/* Form bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Average Form</span>
            <span className={gradeInfo.color}>{averageForm}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
              style={{ width: `${averageForm}%` }}
            />
          </div>
          <p className="text-gray-500 text-sm mt-2 text-center">{gradeInfo.message}</p>
        </div>

        {/* Verification badge */}
        <div className="flex items-center justify-center gap-2 mb-6 py-3 px-4 bg-green-900/30 rounded-xl border border-green-800/50">
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="text-green-400 text-sm font-medium">AI-Verified Push-ups</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition font-medium"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={saved}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? "Saved!" : "Save to Leaderboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
