"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard, getActivityFeed, getWorkouts } from "@/lib/storage";
import { getTodaysChallenge, getTodaysWorkouts, getChallengeProgress } from "@/lib/challenges";
import {
  getNewAchievements,
  dismissAllAchievements,
  Achievement,
} from "@/lib/achievements";
import { playAchievementSound, triggerHaptic } from "@/lib/sounds";
import { LeaderboardEntry, WorkoutSession, ActivityFeedItem } from "@/types";
import LegalFooter from "@/components/LegalFooter";

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ total: 0, sessions: 0, streak: 0 });
  const [userRank, setUserRank] = useState<number | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<{ current: number; target: number; completed: boolean; percent: number } | null>(null);
  const [todaysChallenge, setTodaysChallenge] = useState<ReturnType<typeof getTodaysChallenge> | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      if (profile) {
        const [leaderboard, feed, userWorkouts] = await Promise.all([
          getLeaderboard(false, undefined, "pushup"),
          getActivityFeed(profile.id),
          getWorkouts(profile.id),
        ]);

        const rankIdx = leaderboard.findIndex((e: LeaderboardEntry) => e.userId === profile.id);
        setUserRank(rankIdx >= 0 ? rankIdx + 1 : null);
        setActivityFeed(feed);

        const total = userWorkouts.reduce((sum: number, w: WorkoutSession) => sum + w.count, 0);
        let streak = 0;
        if (userWorkouts.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const workoutDates = new Set(
            userWorkouts.map((w: WorkoutSession) => {
              const d = new Date(w.date);
              d.setHours(0, 0, 0, 0);
              return d.getTime();
            })
          );
          const day = new Date(today);
          if (!workoutDates.has(day.getTime())) day.setDate(day.getDate() - 1);
          while (workoutDates.has(day.getTime())) {
            streak++;
            day.setDate(day.getDate() - 1);
          }
        }
        setStats({ total, sessions: userWorkouts.length, streak });

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
          <h1 className="text-5xl font-black tracking-tight text-gray-900 mb-2">
            DR<span className="text-[#e8450a]">O</span>P
          </h1>
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
      <div className="streak-gradient rounded-2xl p-5 mb-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.356 2.082a.75.75 0 0 0-.712 0c-.207.108-5.052 2.71-6.97 7.834C2.89 14.546 5.477 19.92 11.81 21.94a.75.75 0 0 0 .38 0c6.333-2.02 8.92-7.394 7.136-12.024-1.918-5.124-6.763-7.726-6.97-7.834Z" />
            </svg>
          </div>
          <div>
            <p className="text-white/80 text-xs">Current Streak</p>
            <p className="text-4xl font-black">{stats.streak}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/80 text-sm">Days</p>
          <p className="text-white/90 text-xs font-medium">
            {stats.streak > 0 ? "Keep it going!" : "Start today!"}
          </p>
        </div>
      </div>

      {/* 3 stat cards */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="drop-card p-4 text-center">
          <svg className="w-5 h-5 text-[#e8450a] mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
          </svg>
          <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString()}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Total Reps</p>
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

      {/* Recent Activity */}
      {activityFeed.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Recent Activity
          </h2>
          <div className="space-y-2 mb-6">
            {activityFeed.slice(0, 6).map((item) => {
              const isYou = item.userId === profile?.id;
              return (
                <div key={item.id} className="drop-card flex items-center gap-3 px-4 py-3.5">
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
                      <span className="font-bold text-gray-900">{item.count} reps</span>
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{timeAgo(item.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <LegalFooter />
    </div>
  );
}
