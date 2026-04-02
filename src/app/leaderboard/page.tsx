"use client";

import { useState, useEffect, useCallback } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import Podium from "@/components/Podium";
import AddFriend from "@/components/AddFriend";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard, getWorkouts } from "@/lib/storage";
import { LeaderboardEntry, ExerciseType } from "@/types";
import { getAvailableExercises } from "@/lib/exercise-config";
import { getTodaysChallenge, getTodaysWorkouts, getChallengeProgress } from "@/lib/challenges";

type TabType = "global" | "friends" | "challenge";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<TabType>("global");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("pushup");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const { profile, loading: authLoading } = useAuth();

  const [challengeProgress, setChallengeProgress] = useState<{ current: number; target: number; completed: boolean; percent: number } | null>(null);
  const [todaysChallenge] = useState(getTodaysChallenge);

  const availableExercises = getAvailableExercises();

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white tracking-tight mb-4">Leaderboard</h1>

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
      <div className="flex gap-1.5 mb-4">
        {(["global", "friends", "challenge"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
              tab === t
                ? "bg-drop-600 text-white"
                : "bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800"
            }`}
          >
            {t === "global" ? "Global" : t === "friends" ? "Friends" : "Daily"}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <div className="mb-4">
          <AddFriend onFriendAdded={loadData} />
        </div>
      )}

      {tab === "challenge" ? (
        <div>
          {/* Daily challenge card */}
          <div className={`drop-card rounded-xl p-5 mb-6 border ${challengeProgress?.completed ? "border-green-500/30" : "border-white/5"}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{challengeProgress?.completed ? "✅" : "🎯"}</span>
              <div className="flex-1">
                <p className="text-white font-bold">{todaysChallenge.title}</p>
                <p className="text-neutral-500 text-sm">{todaysChallenge.description}</p>
              </div>
              {challengeProgress && (
                <div className="text-right">
                  <p className={`font-black text-xl tabular-nums ${challengeProgress.completed ? "text-green-400" : "text-white"}`}>
                    {challengeProgress.current}/{challengeProgress.target}
                  </p>
                  <p className="text-neutral-600 text-[10px] uppercase">{todaysChallenge.unit}</p>
                </div>
              )}
            </div>
            {challengeProgress && (
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${challengeProgress.completed ? "bg-green-500" : "bg-drop-600"}`}
                  style={{ width: `${challengeProgress.percent}%` }}
                />
              </div>
            )}
            {challengeProgress?.completed && (
              <p className="text-green-400 text-xs font-medium text-center mt-2">Challenge complete!</p>
            )}
            {!profile && (
              <p className="text-neutral-500 text-xs text-center mt-2">Sign in to track your progress</p>
            )}
          </div>

          {/* Podium + table */}
          {entries.length >= 3 && <Podium entries={entries} currentUserId={profile?.id} />}
          <LeaderboardTable entries={entries} currentUserId={profile?.id} startRank={entries.length >= 3 ? 3 : 0} />
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          {entries.length >= 3 && <Podium entries={entries} currentUserId={profile?.id} />}

          {/* Table for rank 4+ */}
          <LeaderboardTable entries={entries} currentUserId={profile?.id} startRank={entries.length >= 3 ? 3 : 0} />
        </>
      )}

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
