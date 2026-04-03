"use client";

import { LeaderboardEntry } from "@/types";

interface PodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function Podium({ entries, currentUserId }: PodiumProps) {
  if (entries.length < 1) return null;

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  // Podium order: 2nd, 1st, 3rd
  const slots = [
    { entry: second, rank: 2, avatarSize: "w-16 h-16 text-xl", blockH: "h-16", blockBg: "bg-gray-100", ringColor: "" },
    { entry: first, rank: 1, avatarSize: "w-20 h-20 text-2xl", blockH: "h-20", blockBg: "bg-[#e8450a]/10", ringColor: "ring-[3px] ring-[#e8450a]" },
    { entry: third, rank: 3, avatarSize: "w-14 h-14 text-lg", blockH: "h-14", blockBg: "bg-gray-100", ringColor: "" },
  ];

  return (
    <div className="flex items-end justify-center gap-2 pt-8 pb-2">
      {slots.map(({ entry, rank, avatarSize, blockH, blockBg, ringColor }) => {
        if (!entry) return <div key={rank} className="w-28" />;
        const isYou = entry.userId === currentUserId;
        return (
          <div key={rank} className="flex flex-col items-center w-28">
            {/* Avatar */}
            <div
              className={`${avatarSize} rounded-full flex items-center justify-center text-white font-black ${ringColor}`}
              style={{ backgroundColor: entry.avatarColor }}
            >
              {entry.displayName.substring(0, 2).toUpperCase()}
            </div>

            {/* Rank number */}
            <p className="text-gray-400 text-xs mt-1.5">#{rank}</p>

            {/* Name */}
            <p className={`text-sm font-bold truncate max-w-full text-center ${isYou ? "text-[#e8450a]" : "text-gray-900"}`}>
              {entry.displayName}
            </p>

            {/* Reps */}
            <p className="text-[#e8450a] font-bold text-sm tabular-nums">
              {entry.totalReps.toLocaleString()}
            </p>

            {/* Podium block */}
            <div className={`w-full ${blockH} mt-2 rounded-t-xl ${blockBg} flex items-center justify-center`}>
              <span className={`font-black text-2xl ${rank === 1 ? "text-[#e8450a]" : "text-gray-300"}`}>
                {rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
