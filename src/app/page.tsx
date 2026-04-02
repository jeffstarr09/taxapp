"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getWorkouts, getLeaderboard, getActivityFeed } from "@/lib/storage";
import {
  getNewAchievements,
  dismissAllAchievements,
  getTierColor,
  getTierTextColor,
  Achievement,
} from "@/lib/achievements";
import { playAchievementSound, triggerHaptic } from "@/lib/sounds";
import { LeaderboardEntry, WorkoutSession, ActivityFeedItem } from "@/types";

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

export default function HomePage() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ total: 0, sessions: 0, best: 0, streak: 0 });
  const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      // Leaderboard — everyone needs this
      const leaderboard = await getLeaderboard(false, undefined, "pushup");
      setTopEntries(leaderboard.slice(0, 5));

      if (profile) {
        // Find user rank
        const rankIdx = leaderboard.findIndex((e) => e.userId === profile.id);
        setUserRank(rankIdx >= 0 ? rankIdx + 1 : null);

        // User stats
        const userWorkouts = await getWorkouts(profile.id);
        const total = userWorkouts.reduce((sum: number, w: WorkoutSession) => sum + w.count, 0);
        const sessions = userWorkouts.length;
        const best = userWorkouts.reduce((max: number, w: WorkoutSession) => Math.max(max, w.count), 0);

        // Calculate streak (consecutive days with a workout)
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
          // Check today or yesterday first
          if (!workoutDates.has(day.getTime())) {
            day.setDate(day.getDate() - 1);
          }
          while (workoutDates.has(day.getTime())) {
            streak++;
            day.setDate(day.getDate() - 1);
          }
        }

        setStats({ total, sessions, best, streak });

        // Activity feed
        const feed = await getActivityFeed(profile.id);
        setActivityFeed(feed);

        // Achievements
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
      getWorkouts(profile.id).then((userWorkouts) => {
        dismissAllAchievements(userWorkouts);
        setNewAchievements([]);
      });
    }
  };

  // ── Signed-out landing page ──
  if (!authLoading && !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4">
            <span className="text-white">DR</span>
            <span className="text-drop-500">O</span>
            <span className="text-white">P</span>
          </h1>
          <div className="red-line max-w-32 mx-auto mb-6" />
          <p className="text-neutral-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            AI-powered workout counter that verifies every rep.
            <span className="text-white font-medium"> Compete with friends. Climb the leaderboard.</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link
            href="/workout"
            className="w-full sm:w-auto px-10 py-4 bg-drop-600 text-white rounded-xl text-lg font-bold hover:bg-drop-700 transition drop-glow text-center"
          >
            Try It Now
          </Link>
          <Link
            href="/auth"
            className="w-full sm:w-auto px-10 py-4 border border-white/10 text-neutral-300 rounded-xl text-lg font-medium hover:bg-white/5 transition text-center"
          >
            Create Account
          </Link>
        </div>

        {/* How it works — compact visual */}
        <div className="grid grid-cols-3 gap-3 mb-16">
          {[
            { icon: "🎯", title: "AI Tracks", desc: "Camera counts reps" },
            { icon: "✓", title: "Verified", desc: "Form scored in real-time" },
            { icon: "🏆", title: "Compete", desc: "Leaderboards & challenges" },
          ].map((item) => (
            <div key={item.title} className="drop-card rounded-xl p-4 text-center">
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="text-white font-bold text-sm">{item.title}</p>
              <p className="text-neutral-500 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Mini leaderboard preview */}
        {topEntries.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
              Top Performers
            </h2>
            <div className="space-y-1.5">
              {topEntries.slice(0, 3).map((entry, index) => (
                <div key={entry.userId} className="flex items-center gap-3 p-3 drop-card rounded-xl">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-drop-600 text-white" : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {index + 1}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: entry.avatarColor }}
                  >
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-semibold text-sm flex-1 truncate">{entry.displayName}</span>
                  <span className="text-white font-bold tabular-nums text-sm">{entry.totalReps.toLocaleString()}</span>
                  <span className="text-neutral-600 text-[10px] uppercase">reps</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Signed-in dashboard ──
  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* Achievement toast */}
      {newAchievements.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {newAchievements.slice(0, 3).map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-gradient-to-r ${getTierColor(achievement.tier)} border rounded-xl p-4 backdrop-blur-md animate-slide-in`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <p className={`font-bold text-sm ${getTierTextColor(achievement.tier)}`}>
                    {achievement.name}
                  </p>
                  <p className="text-neutral-400 text-xs">{achievement.description}</p>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleDismissAchievements}
            className="w-full text-center text-neutral-500 text-xs py-2 hover:text-white transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Greeting + CTA */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white">
            {profile?.display_name ? `Hey, ${profile.display_name}` : "Dashboard"}
          </h1>
          {userRank && (
            <p className="text-neutral-500 text-xs mt-0.5">
              Ranked <span className="text-drop-400 font-bold">#{userRank}</span> overall
            </p>
          )}
        </div>
        <Link
          href="/workout"
          className="px-6 py-2.5 bg-drop-600 text-white rounded-xl font-bold text-sm hover:bg-drop-700 transition drop-glow"
        >
          Drop
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="drop-card rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-white">{stats.total.toLocaleString()}</p>
          <p className="text-neutral-500 text-[10px] uppercase tracking-wider mt-0.5">Total Reps</p>
        </div>
        <div className="drop-card rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-white">{stats.sessions}</p>
          <p className="text-neutral-500 text-[10px] uppercase tracking-wider mt-0.5">Workouts</p>
        </div>
        <div className="drop-card rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-white">{stats.best}</p>
          <p className="text-neutral-500 text-[10px] uppercase tracking-wider mt-0.5">Best Set</p>
        </div>
        <div className="drop-card rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-white">{stats.streak}</p>
          <p className="text-neutral-500 text-[10px] uppercase tracking-wider mt-0.5">
            Day{stats.streak !== 1 ? "s" : ""} Streak
          </p>
        </div>
      </div>

      {/* Two-column: Leaderboard + Activity Feed */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Mini Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium">Leaderboard</h2>
            <Link href="/leaderboard" className="text-drop-500 hover:text-drop-400 text-xs font-semibold">
              View All
            </Link>
          </div>
          <div className="space-y-1.5">
            {topEntries.map((entry, index) => {
              const isYou = entry.userId === profile?.id;
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-2.5 p-3 drop-card rounded-xl ${isYou ? "border-drop-600/30" : ""}`}
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-drop-600 text-white"
                      : index === 1 ? "bg-neutral-700 text-white"
                        : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {index + 1}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                    style={{ backgroundColor: entry.avatarColor }}
                  >
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {entry.displayName}
                      {isYou && <span className="text-drop-400 text-xs ml-1">(you)</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-bold text-sm tabular-nums">{entry.totalReps.toLocaleString()}</p>
                    <p className="text-neutral-600 text-[9px] uppercase">reps</p>
                  </div>
                </div>
              );
            })}
            {topEntries.length === 0 && (
              <div className="drop-card rounded-xl p-6 text-center">
                <p className="text-neutral-500 text-sm">No one on the board yet. Be first!</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
            Recent Activity
          </h2>
          <div className="space-y-1.5">
            {activityFeed.length > 0 ? (
              activityFeed.slice(0, 8).map((item) => {
                const isYou = item.userId === profile?.id;
                return (
                  <div key={item.id} className="flex items-center gap-2.5 p-3 drop-card rounded-xl">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                      style={{ backgroundColor: item.avatarColor }}
                    >
                      {item.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="text-white font-semibold">{isYou ? "You" : item.displayName}</span>
                        <span className="text-neutral-400"> did </span>
                        <span className="text-white font-bold">{item.count}</span>
                        <span className="text-neutral-400"> {item.exerciseType}s</span>
                      </p>
                    </div>
                    <span className="text-neutral-600 text-xs shrink-0">{timeAgo(item.date)}</span>
                  </div>
                );
              })
            ) : (
              <div className="drop-card rounded-xl p-6 text-center">
                <p className="text-neutral-500 text-sm mb-1">No activity yet</p>
                <p className="text-neutral-600 text-xs">
                  Complete a workout or{" "}
                  <Link href="/leaderboard" className="text-drop-400 hover:text-drop-300">add friends</Link>
                  {" "}to see their activity here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
