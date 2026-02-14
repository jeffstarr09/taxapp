"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, getWorkouts, getLeaderboard, seedDemoData } from "@/lib/storage";
import { User, LeaderboardEntry } from "@/types";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ total: 0, sessions: 0, best: 0 });
  const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    seedDemoData();
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const workouts = getWorkouts(currentUser.id);
      setStats({
        total: workouts.reduce((sum, w) => sum + w.count, 0),
        sessions: workouts.length,
        best: workouts.reduce((max, w) => Math.max(max, w.count), 0),
      });
    }

    const leaderboard = getLeaderboard();
    setTopEntries(leaderboard.slice(0, 3));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          <span className="text-white">PushUp</span>
          <span className="text-blue-500">Pro</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          AI-powered push-up counter that verifies your form in real-time.
          Compete with friends and climb the leaderboard.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <Link
          href="/workout"
          className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 text-center"
        >
          Start Workout
        </Link>
        {!user && (
          <Link
            href="/profile"
            className="w-full sm:w-auto px-8 py-4 border border-gray-600 text-gray-300 rounded-2xl text-lg font-semibold hover:bg-gray-800 transition text-center"
          >
            Create Profile
          </Link>
        )}
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-gray-800/50 rounded-2xl p-6 text-center border border-gray-700/50">
          <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Camera Detection</h3>
          <p className="text-gray-400 text-sm">
            Point your camera at yourself while doing push-ups. Our AI tracks your body in real-time.
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-6 text-center border border-gray-700/50">
          <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Form Verification</h3>
          <p className="text-gray-400 text-sm">
            Each rep is validated for proper form. Get real-time feedback on your technique.
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-6 text-center border border-gray-700/50">
          <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m4.562-6.492C15.408 5.135 12 7.26 12 7.26s-3.408-2.125-6.832-3.996" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Compete & Win</h3>
          <p className="text-gray-400 text-sm">
            Add friends, climb the leaderboard, and compete for the top spot. Track your streaks.
          </p>
        </div>
      </div>

      {/* User stats (if logged in) */}
      {user && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-2xl p-6 text-center border border-gray-700/50">
              <p className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-1">Total Push-ups</p>
            </div>
            <div className="bg-gray-800/50 rounded-2xl p-6 text-center border border-gray-700/50">
              <p className="text-3xl font-bold text-white">{stats.sessions}</p>
              <p className="text-gray-400 text-sm mt-1">Workouts</p>
            </div>
            <div className="bg-gray-800/50 rounded-2xl p-6 text-center border border-gray-700/50">
              <p className="text-3xl font-bold text-white">{stats.best}</p>
              <p className="text-gray-400 text-sm mt-1">Best Session</p>
            </div>
          </div>
        </div>
      )}

      {/* Mini leaderboard */}
      {topEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Top Performers</h2>
            <Link href="/leaderboard" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {topEntries.map((entry, index) => (
              <div
                key={entry.userId}
                className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
              >
                <span className="text-2xl w-8 text-center">
                  {index === 0 ? "\u{1F947}" : index === 1 ? "\u{1F948}" : "\u{1F949}"}
                </span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: entry.avatarColor }}
                >
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{entry.displayName}</p>
                  <p className="text-gray-500 text-sm">@{entry.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{entry.totalPushups.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">push-ups</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
