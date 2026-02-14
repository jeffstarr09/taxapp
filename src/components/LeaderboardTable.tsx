"use client";

import { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

function getMedalEmoji(rank: number): string {
  if (rank === 0) return "\u{1F947}";
  if (rank === 1) return "\u{1F948}";
  if (rank === 2) return "\u{1F949}";
  return "";
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No entries yet.</p>
        <p className="text-gray-500 text-sm mt-2">Complete a workout to appear on the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isCurrentUser = entry.userId === currentUserId;
        const medal = getMedalEmoji(index);
        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-4 p-4 rounded-xl transition ${
              isCurrentUser
                ? "bg-blue-900/30 border border-blue-700/50"
                : "bg-gray-800/50 hover:bg-gray-800"
            }`}
          >
            {/* Rank */}
            <div className="w-10 text-center flex-shrink-0">
              {medal ? (
                <span className="text-2xl">{medal}</span>
              ) : (
                <span className="text-gray-500 font-semibold text-lg">#{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
              style={{ backgroundColor: entry.avatarColor }}
            >
              {entry.displayName.charAt(0).toUpperCase()}
            </div>

            {/* Name & username */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${isCurrentUser ? "text-blue-300" : "text-white"}`}>
                {entry.displayName}
                {isCurrentUser && <span className="text-blue-400 text-xs ml-2">(You)</span>}
              </p>
              <p className="text-gray-500 text-sm">@{entry.username}</p>
            </div>

            {/* Stats */}
            <div className="text-right flex-shrink-0">
              <p className="text-white font-bold text-lg">{entry.totalPushups.toLocaleString()}</p>
              <p className="text-gray-500 text-xs">total reps</p>
            </div>

            {/* Additional stats on larger screens */}
            <div className="hidden md:flex items-center gap-6 flex-shrink-0">
              <div className="text-center">
                <p className="text-white font-semibold">{entry.bestSession}</p>
                <p className="text-gray-500 text-xs">best</p>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">{entry.averageForm}%</p>
                <p className="text-gray-500 text-xs">form</p>
              </div>
              <div className="text-center">
                <p className="text-orange-400 font-semibold">{entry.streak}d</p>
                <p className="text-gray-500 text-xs">streak</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
