"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard, getActivityFeed } from "@/lib/storage";
import {
  getNewAchievements,
  dismissAllAchievements,
  getTierColor,
  getTierTextColor,
  Achievement,
} from "@/lib/achievements";
import { getWorkouts } from "@/lib/storage";
import { playAchievementSound, triggerHaptic } from "@/lib/sounds";
import { LeaderboardEntry, WorkoutSession, ActivityFeedItem } from "@/types";
import Podium from "@/components/Podium";
import LeaderboardTable from "@/components/LeaderboardTable";

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
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      const leaderboard = await getLeaderboard(false, undefined, "pushup");
      setEntries(leaderboard);

      if (profile) {
        const rankIdx = leaderboard.findIndex((e) => e.userId === profile.id);
        setUserRank(rankIdx >= 0 ? rankIdx + 1 : null);

        const feed = await getActivityFeed(profile.id);
        setActivityFeed(feed);

        const userWorkouts = await getWorkouts(profile.id);
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

  // ── Signed-out landing page ──
  if (!authLoading && !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-3">
            <span className="text-white">DR</span>
            <span className="text-drop-500">O</span>
            <span className="text-white">P</span>
          </h1>
          <div className="red-line max-w-32 mx-auto mb-4" />
          <p className="text-neutral-400 text-base max-w-md mx-auto">
            AI-powered pushup counter.
            <span className="text-white font-medium"> Compete with friends. Climb the board.</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Link
            href="/workout"
            className="px-8 py-3.5 bg-drop-600 text-white rounded-xl text-base font-bold hover:bg-drop-700 transition drop-glow"
          >
            Try It Now
          </Link>
          <Link
            href="/auth"
            className="px-8 py-3.5 border border-white/10 text-neutral-300 rounded-xl text-base font-medium hover:bg-white/5 transition"
          >
            Sign Up
          </Link>
        </div>

        {/* Podium preview */}
        {entries.length >= 3 && <Podium entries={entries} />}

        {/* Rest of leaderboard */}
        {entries.length > 3 && (
          <LeaderboardTable entries={entries} startRank={3} />
        )}

        {entries.length > 0 && entries.length <= 3 && (
          <LeaderboardTable entries={entries} />
        )}
      </div>
    );
  }

  // ── Signed-in: leaderboard-focused home ──
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
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

      {/* Header with rank + Drop CTA */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-black text-white">
            {profile?.display_name ? `Hey, ${profile.display_name}` : "Leaderboard"}
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

      {/* Podium — top 3 */}
      {entries.length >= 3 && (
        <Podium entries={entries} currentUserId={profile?.id} />
      )}

      {/* Leaderboard with gradient bars — rank 4+ */}
      {entries.length > 3 && (
        <LeaderboardTable entries={entries} currentUserId={profile?.id} startRank={3} />
      )}

      {/* Fallback if < 3 entries */}
      {entries.length > 0 && entries.length < 3 && (
        <LeaderboardTable entries={entries} currentUserId={profile?.id} />
      )}

      {entries.length === 0 && (
        <div className="drop-card rounded-xl p-8 text-center mb-6">
          <p className="text-neutral-400 mb-2">No one on the board yet</p>
          <Link href="/workout" className="text-drop-400 font-semibold text-sm hover:text-drop-300">
            Be the first to drop
          </Link>
        </div>
      )}

      {/* Activity Feed */}
      {activityFeed.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
            Recent Activity
          </h2>
          <div className="space-y-1">
            {activityFeed.slice(0, 8).map((item) => {
              const isYou = item.userId === profile?.id;
              return (
                <div key={item.id} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-900/50">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                    style={{ backgroundColor: item.avatarColor }}
                  >
                    {item.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="text-white font-semibold">{isYou ? "You" : item.displayName}</span>
                      <span className="text-neutral-500"> did </span>
                      <span className="text-white font-bold">{item.count}</span>
                      <span className="text-neutral-500"> {item.exerciseType}s</span>
                    </p>
                  </div>
                  <span className="text-neutral-600 text-xs shrink-0">{timeAgo(item.date)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
