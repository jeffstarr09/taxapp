"use client";

import { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  startRank?: number;
}

export default function LeaderboardTable({ entries, currentUserId, startRank = 0 }: LeaderboardTableProps) {
  const displayEntries = entries.slice(startRank);

  if (displayEntries.length === 0 && startRank === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg font-medium">No entries yet</p>
        <p className="text-gray-300 text-sm mt-2">Complete a workout to claim your spot.</p>
      </div>
    );
  }

  if (displayEntries.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      {displayEntries.map((entry, index) => {
        const rank = startRank + index + 1;
        const isCurrentUser = entry.userId === currentUserId;

        return (
          <div
            key={entry.userId}
            className={`drop-card flex items-center gap-3 px-4 py-3.5 ${
              isCurrentUser ? "ring-1 ring-[#e8450a]/20" : ""
            }`}
          >
            {/* Rank */}
            <span className="text-gray-400 font-bold text-sm tabular-nums w-6 text-center shrink-0">
              {rank}
            </span>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
              style={{ backgroundColor: entry.avatarColor }}
            >
              {entry.displayName.substring(0, 2).toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${isCurrentUser ? "text-[#e8450a]" : "text-gray-900"}`}>
                {entry.displayName}
              </p>
              <p className="text-gray-400 text-xs">@{entry.username}</p>
            </div>

            {/* Reps */}
            <p className="text-[#e8450a] font-bold tabular-nums shrink-0">
              {entry.totalReps.toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
