"use client";

import { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  /** Skip the first N entries (e.g. 3 if podium is shown separately) */
  startRank?: number;
}

export default function LeaderboardTable({ entries, currentUserId, startRank = 0 }: LeaderboardTableProps) {
  const displayEntries = entries.slice(startRank);
  const maxReps = entries.length > 0 ? entries[0].totalReps : 1;

  if (displayEntries.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-400 text-lg font-medium">No entries yet</p>
        <p className="text-neutral-600 text-sm mt-2">Complete a workout to claim your spot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayEntries.map((entry, index) => {
        const rank = startRank + index + 1;
        const isCurrentUser = entry.userId === currentUserId;
        const barPercent = maxReps > 0 ? Math.max(8, (entry.totalReps / maxReps) * 100) : 8;

        return (
          <div
            key={entry.userId}
            className={`relative overflow-hidden rounded-xl transition-all ${
              isCurrentUser ? "ring-1 ring-drop-600/40" : ""
            }`}
          >
            {/* Gradient bar background — shows relative score */}
            <div
              className={`absolute inset-y-0 left-0 rounded-xl ${
                isCurrentUser
                  ? "bg-gradient-to-r from-drop-600/30 to-drop-600/5"
                  : "bg-gradient-to-r from-drop-600/15 to-transparent"
              }`}
              style={{ width: `${barPercent}%` }}
            />

            {/* Content */}
            <div className="relative flex items-center gap-3 px-4 py-3">
              {/* Rank */}
              <span className="text-neutral-600 font-bold text-sm tabular-nums w-6 text-center shrink-0">
                {rank}
              </span>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
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
              </div>

              {/* Reps */}
              <div className="text-right shrink-0">
                <p className="text-white font-bold tabular-nums">{entry.totalReps.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
