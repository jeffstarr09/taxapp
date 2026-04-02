"use client";

import { LeaderboardEntry } from "@/types";

interface PodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function Podium({ entries, currentUserId }: PodiumProps) {
  if (entries.length < 1) return null;

  // Podium order: 2nd, 1st, 3rd (visually: left, center, right)
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  const podiumSlots = [
    { entry: second, rank: 2, height: "h-20", size: "w-14 h-14", textSize: "text-xl", badge: "bg-neutral-400" },
    { entry: first, rank: 1, height: "h-28", size: "w-18 h-18", textSize: "text-2xl", badge: "bg-drop-500" },
    { entry: third, rank: 3, height: "h-14", size: "w-12 h-12", textSize: "text-lg", badge: "bg-amber-700" },
  ];

  return (
    <div className="flex items-end justify-center gap-3 mb-6 pt-6 pb-2">
      {podiumSlots.map(({ entry, rank, height, badge }) => {
        if (!entry) return <div key={rank} className="w-24" />;
        const isYou = entry.userId === currentUserId;
        return (
          <div key={rank} className="flex flex-col items-center w-28">
            {/* Avatar */}
            <div className="relative mb-2">
              <div
                className={`${rank === 1 ? "w-[72px] h-[72px]" : rank === 2 ? "w-14 h-14" : "w-12 h-12"} rounded-full flex items-center justify-center text-white font-black border-2 ${rank === 1 ? "border-drop-500 text-2xl" : rank === 2 ? "border-neutral-400 text-lg" : "border-amber-700 text-base"}`}
                style={{ backgroundColor: entry.avatarColor }}
              >
                {entry.displayName.charAt(0).toUpperCase()}
              </div>
              {/* Rank badge */}
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 ${badge} rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg`}>
                {rank}
              </div>
            </div>

            {/* Name */}
            <p className={`text-xs font-bold truncate max-w-full text-center ${isYou ? "text-drop-400" : "text-white"}`}>
              {entry.displayName}
            </p>

            {/* Reps */}
            <p className="text-white font-black text-sm tabular-nums mt-0.5">
              {entry.totalReps.toLocaleString()}
            </p>

            {/* Podium bar */}
            <div className={`w-full ${height} mt-2 rounded-t-xl bg-gradient-to-t ${rank === 1 ? "from-drop-700 to-drop-500" : rank === 2 ? "from-neutral-700 to-neutral-500" : "from-amber-900 to-amber-700"}`} />
          </div>
        );
      })}
    </div>
  );
}
