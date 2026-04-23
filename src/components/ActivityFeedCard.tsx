"use client";

import { useState } from "react";
import { ActivityFeedItem } from "@/types";
import { addReaction, getReactions, getUserReaction, REACTION_EMOJIS, ReactionType } from "@/lib/reactions";
import { getExerciseConfig } from "@/lib/exercise-config";

interface ActivityFeedCardProps {
  item: ActivityFeedItem;
  currentUserId?: string;
}

export default function ActivityFeedCard({ item, currentUserId }: ActivityFeedCardProps) {
  const isYou = item.userId === currentUserId;
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    currentUserId ? getUserReaction(item.id, currentUserId) : null
  );
  const [reactionCounts, setReactionCounts] = useState(() => {
    const reactions = getReactions(item.id);
    const counts: Partial<Record<ReactionType, number>> = {};
    reactions.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return counts;
  });
  const [showReactions, setShowReactions] = useState(false);

  const config = getExerciseConfig(item.exerciseType);
  const timeAgo = getTimeAgo(item.date);

  const handleReaction = (type: ReactionType) => {
    if (!currentUserId) return;
    addReaction(item.id, currentUserId, type);

    setReactionCounts((prev) => {
      const next = { ...prev };
      if (userReaction === type) {
        next[type] = Math.max(0, (next[type] || 1) - 1);
        if (next[type] === 0) delete next[type];
      } else {
        if (userReaction) {
          next[userReaction] = Math.max(0, (next[userReaction] || 1) - 1);
          if (next[userReaction] === 0) delete next[userReaction];
        }
        next[type] = (next[type] || 0) + 1;
      }
      return next;
    });

    setUserReaction((prev) => (prev === type ? null : type));
    setShowReactions(false);
  };

  const totalReactions = Object.values(reactionCounts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="drop-card px-4 py-3.5">
      <div className="flex items-center gap-3">
        {item.avatarUrl ? (
          <img src={item.avatarUrl} alt={item.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: item.avatarColor }}
          >
            {item.displayName.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-gray-900">@{isYou ? "you" : item.username}</span>
            {" completed "}
            <span className="font-bold text-gray-900">{item.count} {config.labelPlural.toLowerCase()}</span>
          </p>
          <p className="text-gray-400 text-xs mt-0.5">{timeAgo}</p>
        </div>
      </div>

      {/* Reactions row */}
      {currentUserId && (
        <div className="flex items-center gap-2 mt-2 ml-13">
          {/* Existing reactions */}
          {Object.entries(reactionCounts).map(([type, count]) => (
            <button
              key={type}
              onClick={() => handleReaction(type as ReactionType)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition ${
                userReaction === type
                  ? "bg-[#e8450a]/10 border border-[#e8450a]/20"
                  : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
              }`}
            >
              <span>{REACTION_EMOJIS[type as ReactionType]}</span>
              <span className="text-gray-500 tabular-nums">{count}</span>
            </button>
          ))}

          {/* Add reaction button */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                totalReactions > 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </button>
            {showReactions && (
              <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 flex gap-1 z-50">
                {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 transition ${
                      userReaction === type ? "bg-[#e8450a]/10" : ""
                    }`}
                  >
                    {REACTION_EMOJIS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
