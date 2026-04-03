"use client";

import { useState, useEffect, useCallback } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import Podium from "@/components/Podium";
import AddFriend from "@/components/AddFriend";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard, getWorkouts } from "@/lib/storage";
import { LeaderboardEntry, ExerciseType } from "@/types";
import { getTodaysChallenge, getTodaysWorkouts, getChallengeProgress } from "@/lib/challenges";

type TabType = "global" | "friends" | "challenge";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<TabType>("global");
  const [exerciseType] = useState<ExerciseType>("pushup");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const { profile, loading: authLoading } = useAuth();

  const [challengeProgress, setChallengeProgress] = useState<{ current: number; target: number; completed: boolean; percent: number } | null>(null);
  const [todaysChallenge] = useState(getTodaysChallenge);

  const loadData = useCallback(async () => {
    if (tab === "challenge") {
      if (profile?.id) {
        const allWorkouts = await getWorkouts(profile.id);
        const todayW = getTodaysWorkouts(allWorkouts, profile.id);
        setChallengeProgress(getChallengeProgress(todaysChallenge, todayW));
      }
      const leaderboard = await getLeaderboard(false, profile?.id, exerciseType);
      setEntries(leaderboard);
    } else {
      const leaderboard = await getLeaderboard(
        tab === "friends",
        profile?.id,
        exerciseType
      );
      setEntries(leaderboard);
    }
  }, [tab, profile, exerciseType, todaysChallenge]);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [loadData, authLoading]);

  // Hours remaining in the day
  const hoursLeft = 24 - new Date().getHours();

  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <h1 className="text-3xl font-black text-gray-900 mb-5">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["global", "friends", "challenge"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${
              tab === t
                ? "bg-[#e8450a] text-white"
                : "bg-white border border-gray-200 text-gray-500"
            }`}
          >
            {t === "global" ? "Global" : t === "friends" ? "Friends" : "Daily"}
          </button>
        ))}
      </div>

      {/* Friends tab — search */}
      {tab === "friends" && (
        <div className="mb-4">
          <AddFriend onFriendAdded={loadData} />
        </div>
      )}

      {/* Daily tab — challenge card */}
      {tab === "challenge" && (
        <div className="drop-card p-5 mb-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-[#e8450a]/10 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#e8450a]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{todaysChallenge.title}</p>
              <p className="text-gray-400 text-sm">{todaysChallenge.description}</p>
            </div>
          </div>
          {challengeProgress && (
            <>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="font-bold text-gray-900">{challengeProgress.current} / {challengeProgress.target}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${challengeProgress.completed ? "bg-green-500" : "bg-[#e8450a]"}`}
                  style={{ width: `${challengeProgress.percent}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs text-right mt-1.5">Expires in {hoursLeft}h</p>
            </>
          )}
        </div>
      )}

      {/* Podium */}
      {entries.length >= 3 && <Podium entries={entries} currentUserId={profile?.id} />}

      {/* Table for rank 4+ */}
      <LeaderboardTable entries={entries} currentUserId={profile?.id} startRank={entries.length >= 3 ? 3 : 0} />

      {!profile && (
        <div className="mt-8 drop-card p-6 text-center">
          <p className="text-gray-400 text-sm mb-3">Create an account to track your ranking</p>
          <a
            href="/auth"
            className="inline-block px-6 py-2.5 bg-[#e8450a] text-white rounded-xl font-semibold text-sm"
          >
            Sign In
          </a>
        </div>
      )}
    </div>
  );
}
