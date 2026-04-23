"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard, getActivityFeed, getWorkouts, saveWorkout } from "@/lib/storage";
import { getPendingWorkout, clearPendingWorkout } from "@/lib/pending-workout";
import { getTodaysChallenge, getTodaysWorkouts, getChallengeProgress } from "@/lib/challenges";
import {
  getNewAchievements,
  dismissAllAchievements,
  Achievement,
} from "@/lib/achievements";
import { playAchievementSound, triggerHaptic } from "@/lib/sounds";
import { computeStreak, streakMessage, StreakInfo } from "@/lib/streaks";
import { totalCalories } from "@/lib/calories";
import { LeaderboardEntry, WorkoutSession, ActivityFeedItem } from "@/types";
import LegalFooter from "@/components/LegalFooter";
import ActivityFeedCard from "@/components/ActivityFeedCard";
import { storeReferralCode } from "@/lib/referrals";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ total: 0, sessions: 0, calories: 0 });
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({ count: 0, workedOutToday: false, isAtRisk: false });
  const [userRank, setUserRank] = useState<number | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<{ current: number; target: number; completed: boolean; percent: number } | null>(null);
  const [todaysChallenge, setTodaysChallenge] = useState<ReturnType<typeof getTodaysChallenge> | null>(null);

  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const [pendingSaved, setPendingSaved] = useState(false);

  useEffect(() => { storeReferralCode(); }, []);

  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      if (profile) {
        // Check for a workout completed as a guest before sign-up.
        // If one exists, save it now that we have auth, then clear it.
        const pending = getPendingWorkout();
        if (pending) {
          try {
            const { v4: uuidv4 } = await import("uuid");
            await saveWorkout({
              id: uuidv4(),
              userId: profile.id,
              exerciseType: pending.exerciseType,
              count: pending.count,
              duration: pending.duration,
              averageFormScore: pending.avgForm,
              timestamps: pending.timestamps,
              date: pending.date,
              verified: true,
            });
            setPendingSaved(true);
          } catch {
            // Silently fail — the workout was best-effort
          }
          clearPendingWorkout();
        }

        const [leaderboard, feed, userWorkouts] = await Promise.all([
          getLeaderboard(false, undefined, "pushup"),
          getActivityFeed(profile.id),
          getWorkouts(profile.id),
        ]);

        const rankIdx = leaderboard.findIndex((e: LeaderboardEntry) => e.userId === profile.id);
        setUserRank(rankIdx >= 0 ? rankIdx + 1 : null);
        setActivityFeed(feed);

        const total = userWorkouts.reduce((sum: number, w: WorkoutSession) => sum + w.count, 0);
        const calories = totalCalories(userWorkouts);
        setStats({ total, sessions: userWorkouts.length, calories });
        setStreakInfo(computeStreak(userWorkouts));

        const challenge = getTodaysChallenge();
        setTodaysChallenge(challenge);
        const todayWorkouts = getTodaysWorkouts(userWorkouts, profile.id);
        setChallengeProgress(getChallengeProgress(challenge, todayWorkouts));

        const freshAchievements = getNewAchievements(userWorkouts);
        if (freshAchievements.length > 0) {
          setNewAchievements(freshAchievements);
          playAchievementSound();
          triggerHaptic("heavy");
        }
      }
    };

    loadData();
  }, [authLoading, profile]);

  const handleDismissAchievements = () => {
    if (profile) {
      getWorkouts(profile.id).then((userWorkouts: WorkoutSession[]) => {
        dismissAllAchievements(userWorkouts);
        setNewAchievements([]);
      });
    }
  };

  // Signed-out landing
  if (!authLoading && !profile) {
    return (
      <div className="max-w-lg mx-auto px-5 py-12">
        <div className="text-center mb-10">
          <img
            src="/drop-logo.png"
            alt="DROP"
            className="w-40 mx-auto mb-3 object-contain mix-blend-multiply"
          />
          <p className="text-gray-500 text-base">
            AI-powered pushup counter. Compete with friends.
          </p>
        </div>
        <div className="flex flex-col gap-3 mb-10">
          <Link
            href="/workout"
            className="w-full py-4 bg-[#dc2626] text-white rounded-2xl text-lg font-bold text-center"
          >
            Try It Now
          </Link>
          <Link
            href="/auth"
            className="w-full py-4 border border-gray-200 text-gray-700 rounded-2xl text-lg font-medium text-center"
          >
            Create Account
          </Link>
        </div>
        <LegalFooter />
      </div>
    );
  }

  // Signed-in home
  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      {/* Pending workout saved banner */}
      {pendingSaved && (
        <div className="mb-4 p-3 rounded-xl border border-green-500/20 bg-green-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <p className="text-green-700 text-sm font-medium">Your workout was saved to the leaderboard!</p>
          <button onClick={() => setPendingSaved(false)} className="ml-auto text-green-400 hover:text-green-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Achievement toast */}
      {newAchievements.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {newAchievements.slice(0, 3).map((achievement) => (
            <div
              key={achievement.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg animate-slide-in"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <p className="font-bold text-sm text-gray-900">{achievement.name}</p>
                  <p className="text-gray-500 text-xs">{achievement.description}</p>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleDismissAchievements}
            className="w-full text-center text-gray-400 text-xs py-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Greeting */}
      <p className="text-gray-400 text-sm">{getGreeting()}</p>
      <h1 className="text-3xl font-black text-gray-900 mb-5">
        {profile?.display_name?.split(" ")[0] || ""}
      </h1>

      {/* Streak gradient card */}
      <div className={`rounded-2xl p-5 mb-5 text-white flex items-center justify-between ${streakInfo.isAtRisk ? "bg-gradient-to-r from-amber-600 to-orange-600" : "streak-gradient"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.356 2.082a.75.75 0 0 0-.712 0c-.207.108-5.052 2.71-6.97 7.834C2.89 14.546 5.477 19.92 11.81 21.94a.75.75 0 0 0 .38 0c6.333-2.02 8.92-7.394 7.136-12.024-1.918-5.124-6.763-7.726-6.97-7.834Z" />
            </svg>
          </div>
          <div>
            <p className="text-white/80 text-xs">Current Streak</p>
            <p className="text-4xl font-black">{streakInfo.count}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/80 text-sm">Days</p>
          <p className="text-white/90 text-xs font-medium">
            {streakMessage(streakInfo)}
          </p>
        </div>
      </div>

      {/* 3 stat cards */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="drop-card p-4 text-center">
          <svg className="w-5 h-5 text-[#e8450a] mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
          </svg>
          <p className="text-2xl font-black text-gray-900">{Math.round(stats.calories).toLocaleString()}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Calories</p>
        </div>
        <div className="drop-card p-4 text-center">
          <svg className="w-5 h-5 text-[#e8450a] mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
          </svg>
          <p className="text-2xl font-black text-gray-900">
            {userRank ? `#${userRank}` : "-"}
          </p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Global Rank</p>
        </div>
        <div className="drop-card p-4 text-center">
          <svg className="w-5 h-5 text-[#e8450a] mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <p className="text-2xl font-black text-gray-900">{stats.sessions}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Workouts</p>
        </div>
      </div>

      {/* Today's Challenge */}
      {todaysChallenge && challengeProgress && (
        <>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Today&apos;s Challenge
          </h2>
          <div className="drop-card p-5 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-[#e8450a]/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#e8450a]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{todaysChallenge.title}</p>
                <p className="text-gray-400 text-sm">{todaysChallenge.description}</p>
              </div>
            </div>
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
            {challengeProgress.completed && (
              <p className="text-green-600 text-xs font-medium text-center mt-2">Challenge complete!</p>
            )}
          </div>
        </>
      )}

      {/* Rewards CTA */}
      {profile && (
        <Link href="/rewards" className="block drop-card p-4 mb-6 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8450a]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#e8450a]" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39.986 3.38.152l.094-.082 4.5-4.5a2.396 2.396 0 0 0 .07-3.472L11.182 4.07A3 3 0 0 0 9.061 3.19L5.25 2.25ZM7.5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Active Challenges</p>
              <p className="text-gray-400 text-xs">Compete to win products from top brands</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      )}

      {/* Recent Activity */}
      {activityFeed.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Recent Activity
          </h2>
          <div className="space-y-2 mb-6">
            {activityFeed.slice(0, 6).map((item) => (
              <ActivityFeedCard key={item.id} item={item} currentUserId={profile?.id} />
            ))}
          </div>
        </>
      )}

      <LegalFooter />
    </div>
  );
}
