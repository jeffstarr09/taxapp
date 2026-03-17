"use client";

import { useState, useEffect, useCallback } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import AddFriend from "@/components/AddFriend";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard } from "@/lib/storage";
import { LeaderboardEntry, ExerciseType } from "@/types";
import { getAvailableExercises } from "@/lib/exercise-config";

type TabType = "global" | "friends";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<TabType>("global");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("pushup");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const { profile, loading: authLoading } = useAuth();

  const availableExercises = getAvailableExercises();

  const loadData = useCallback(async () => {
    const leaderboard = await getLeaderboard(
      tab === "friends",
      profile?.id,
      exerciseType
    );
    setEntries(leaderboard);
  }, [tab, profile, exerciseType]);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [loadData, authLoading]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white tracking-tight mb-6">Leaderboard</h1>

      {/* Exercise type filter */}
      {availableExercises.length > 1 && (
        <div className="flex gap-2 mb-4">
          {availableExercises.map((ex) => (
            <button
              key={ex.type}
              onClick={() => setExerciseType(ex.type)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                exerciseType === ex.type
                  ? "bg-drop-600 text-white"
                  : "bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <span>{ex.icon}</span>
              {ex.labelPlural}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6">
        <button
          onClick={() => setTab("global")}
          className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
            tab === "global"
              ? "bg-drop-600 text-white"
              : "bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800"
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setTab("friends")}
          className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
            tab === "friends"
              ? "bg-drop-600 text-white"
              : "bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800"
          }`}
        >
          Friends
        </button>
      </div>

      {tab === "friends" && (
        <div className="mb-6">
          <AddFriend onFriendAdded={loadData} />
        </div>
      )}

      <LeaderboardTable entries={entries} currentUserId={profile?.id} />

      {!profile && (
        <div className="mt-8 drop-card rounded-xl p-6 text-center">
          <p className="text-neutral-400 text-sm mb-3">Create an account to track your ranking</p>
          <a
            href="/auth"
            className="inline-block px-6 py-2.5 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-semibold text-sm"
          >
            Sign In
          </a>
        </div>
      )}
    </div>
  );
}
