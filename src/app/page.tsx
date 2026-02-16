"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCurrentUser,
  getWorkouts,
  getLeaderboard,
  seedDemoData,
} from "@/lib/storage";
import {
  getTodaysChallenge,
  getTodaysWorkouts,
  getChallengeProgress,
} from "@/lib/challenges";
import {
  getNewAchievements,
  dismissAllAchievements,
  getTierColor,
  getTierTextColor,
  Achievement,
} from "@/lib/achievements";
import { playAchievementSound, triggerHaptic } from "@/lib/sounds";
import { User, LeaderboardEntry } from "@/types";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ total: 0, sessions: 0, best: 0 });
  const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<{
    current: number;
    target: number;
    completed: boolean;
    percent: number;
  } | null>(null);
  const [challenge, setChallenge] = useState<ReturnType<
    typeof getTodaysChallenge
  > | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [globalReps, setGlobalReps] = useState(0);

  useEffect(() => {
    seedDemoData();
    const currentUser = getCurrentUser();
    setUser(currentUser);

    const allWorkouts = getWorkouts();

    // Global rep counter for social proof
    setGlobalReps(allWorkouts.reduce((sum, w) => sum + w.count, 0));

    if (currentUser) {
      const userWorkouts = getWorkouts(currentUser.id);
      setStats({
        total: userWorkouts.reduce((sum, w) => sum + w.count, 0),
        sessions: userWorkouts.length,
        best: userWorkouts.reduce((max, w) => Math.max(max, w.count), 0),
      });

      // Daily challenge
      const todaysChallenge = getTodaysChallenge();
      setChallenge(todaysChallenge);
      const todaysWorkouts = getTodaysWorkouts(allWorkouts, currentUser.id);
      setChallengeProgress(
        getChallengeProgress(todaysChallenge, todaysWorkouts)
      );

      // Check for new achievements
      const freshAchievements = getNewAchievements(userWorkouts);
      if (freshAchievements.length > 0) {
        setNewAchievements(freshAchievements);
        playAchievementSound();
        triggerHaptic("heavy");
      }
    }

    const leaderboard = getLeaderboard();
    setTopEntries(leaderboard.slice(0, 3));
  }, []);

  const handleDismissAchievements = () => {
    if (user) {
      const userWorkouts = getWorkouts(user.id);
      dismissAllAchievements(userWorkouts);
      setNewAchievements([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
                  <p className="text-neutral-400 text-xs">
                    {achievement.description}
                  </p>
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

      {/* Hero */}
      <div className="text-center mb-16 pt-8">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4">
          <span className="text-white">DR</span>
          <span className="text-drop-500">O</span>
          <span className="text-white">P</span>
        </h1>
        <div className="red-line max-w-32 mx-auto mb-6" />
        <p className="text-neutral-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
          AI-powered push-up counter that verifies every rep.
          <span className="text-white font-medium"> Drop. Push. Prove.</span>
        </p>
        {globalReps > 0 && (
          <p className="text-neutral-600 text-sm mt-4">
            <span className="text-white font-bold tabular-nums">
              {globalReps.toLocaleString()}
            </span>{" "}
            push-ups counted and verified
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
        <Link
          href="/workout"
          className="w-full sm:w-auto px-10 py-4 bg-drop-600 text-white rounded-xl text-lg font-bold hover:bg-drop-700 transition drop-glow text-center"
        >
          Start Workout
        </Link>
        {!user && (
          <Link
            href="/profile"
            className="w-full sm:w-auto px-10 py-4 border border-white/10 text-neutral-300 rounded-xl text-lg font-medium hover:bg-white/5 transition text-center"
          >
            Create Profile
          </Link>
        )}
      </div>

      {/* Daily Challenge */}
      {user && challenge && challengeProgress && (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4">
            Daily Challenge
          </h2>
          <div
            className={`drop-card rounded-2xl p-6 ${
              challengeProgress.completed
                ? "border-green-500/30"
                : "drop-card-hover"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-bold">{challenge.title}</h3>
                <p className="text-neutral-500 text-sm">
                  {challenge.description}
                </p>
              </div>
              {challengeProgress.completed ? (
                <span className="px-3 py-1 bg-green-500/15 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                  COMPLETE
                </span>
              ) : (
                <span className="text-white font-bold tabular-nums">
                  {challengeProgress.current}/{challengeProgress.target}
                </span>
              )}
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  challengeProgress.completed
                    ? "bg-green-500"
                    : "bg-gradient-to-r from-drop-600 to-drop-400"
                }`}
                style={{ width: `${challengeProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-4 mb-20">
        <div className="drop-card drop-card-hover rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-drop-600/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-drop-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <h3 className="text-white font-bold text-sm mb-2">AI Detection</h3>
          <p className="text-neutral-500 text-sm">
            Point your camera. Our AI tracks your body in real-time using pose
            detection.
          </p>
        </div>
        <div className="drop-card drop-card-hover rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-drop-600/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-drop-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
          </div>
          <h3 className="text-white font-bold text-sm mb-2">Form Verified</h3>
          <p className="text-neutral-500 text-sm">
            Every rep is scored for form. Get real-time coaching on your
            technique.
          </p>
        </div>
        <div className="drop-card drop-card-hover rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-drop-600/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-drop-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
          </div>
          <h3 className="text-white font-bold text-sm mb-2">Compete</h3>
          <p className="text-neutral-500 text-sm">
            Daily challenges, achievements, and leaderboards. Challenge your
            friends.
          </p>
        </div>
      </div>

      {/* User stats */}
      {user && (
        <div className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4">
            Your Stats
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="drop-card rounded-xl p-5 text-center">
              <p className="text-3xl font-black text-white">
                {stats.total.toLocaleString()}
              </p>
              <p className="text-neutral-500 text-xs mt-1 uppercase tracking-wider">
                Total
              </p>
            </div>
            <div className="drop-card rounded-xl p-5 text-center">
              <p className="text-3xl font-black text-white">{stats.sessions}</p>
              <p className="text-neutral-500 text-xs mt-1 uppercase tracking-wider">
                Sessions
              </p>
            </div>
            <div className="drop-card rounded-xl p-5 text-center">
              <p className="text-3xl font-black text-white">{stats.best}</p>
              <p className="text-neutral-500 text-xs mt-1 uppercase tracking-wider">
                Best
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mini leaderboard */}
      {topEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium">
              Top Performers
            </h2>
            <Link
              href="/leaderboard"
              className="text-drop-500 hover:text-drop-400 text-xs font-semibold uppercase tracking-wider"
            >
              View All
            </Link>
          </div>
          <div className="space-y-1.5">
            {topEntries.map((entry, index) => (
              <div
                key={entry.userId}
                className="flex items-center gap-3 p-3.5 drop-card drop-card-hover rounded-xl"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? "bg-drop-600 text-white"
                      : index === 1
                        ? "bg-neutral-700 text-white"
                        : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {index + 1}
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: entry.avatarColor }}
                >
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {entry.displayName}
                  </p>
                  <p className="text-neutral-600 text-xs">
                    @{entry.username}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold tabular-nums">
                    {entry.totalPushups.toLocaleString()}
                  </p>
                  <p className="text-neutral-600 text-[10px] uppercase tracking-wider">
                    reps
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
