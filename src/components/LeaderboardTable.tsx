"use client";

import { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

function getRankDisplay(rank: number): { text: string; style: string } {
  if (rank === 0) return { text: "1", style: "bg-drop-600 text-white font-black" };
  if (rank === 1) return { text: "2", style: "bg-neutral-700 text-white font-bold" };
  if (rank === 2) return { text: "3", style: "bg-neutral-800 text-neutral-300 font-bold" };
  return { text: `${rank + 1}`, style: "bg-transparent text-neutral-600 font-medium" };
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-400 text-lg font-medium">No entries yet</p>
        <p className="text-neutral-600 text-sm mt-2">Complete a workout to claim your spot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry, index) => {
        const isCurrentUser = entry.userId === currentUserId;
        const rank = getRankDisplay(index);
        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all ${
              isCurrentUser
                ? "drop-card border-drop-900/50 bg-drop-950/20"
                : "drop-card drop-card-hover"
            }`}
          >
            {/* Rank */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${rank.style}`}>
              {rank.text}
            </div>

            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
              style={{ backgroundColor: entry.avatarColor }}
            >
              {entry.displayName.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${isCurrentUser ? "text-drop-300" : "text-white"}`}>
                {entry.displayName}
                {isCurrentUser && <span className="text-drop-500 text-xs ml-1.5">you</span>}
              </p>
              <p className="text-neutral-600 text-xs">@{entry.username}</p>
            </div>

            {/* Total reps */}
            <div className="text-right flex-shrink-0">
              <p className="text-white font-bold text-lg tabular-nums">{entry.totalPushups.toLocaleString()}</p>
              <p className="text-neutral-600 text-[10px] uppercase tracking-wider">reps</p>
            </div>

            {/* Extra stats on desktop */}
            <div className="hidden md:flex items-center gap-5 flex-shrink-0">
              <div className="text-center w-12">
                <p className="text-white font-semibold text-sm">{entry.bestSession}</p>
                <p className="text-neutral-600 text-[10px] uppercase tracking-wider">best</p>
              </div>
              <div className="text-center w-12">
                <p className="text-white font-semibold text-sm">{entry.averageForm}%</p>
                <p className="text-neutral-600 text-[10px] uppercase tracking-wider">form</p>
              </div>
              <div className="text-center w-12">
                <p className="text-drop-400 font-semibold text-sm">{entry.streak}d</p>
                <p className="text-neutral-600 text-[10px] uppercase tracking-wider">streak</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
