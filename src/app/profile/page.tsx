"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getWorkouts, updateProfile, getFriends, getLeaderboard, removeFriend } from "@/lib/storage";
import { getUnlockedAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { getTodaysChallenge, getTodaysWorkouts, getChallengeProgress } from "@/lib/challenges";
import { User, WorkoutSession } from "@/types";
import { getExerciseConfig } from "@/lib/exercise-config";

const AVATAR_COLORS = [
  "#dc2626", "#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function ProfilePage() {
  const { profile, user, loading: authLoading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    setUsername(profile.username);
    setDisplayName(profile.display_name);
    setSelectedColor(profile.avatar_color);

    const loadData = async () => {
      const [w, f, lb] = await Promise.all([
        getWorkouts(profile.id),
        getFriends(profile.id),
        getLeaderboard(false, profile.id, "pushup"),
      ]);
      setWorkouts(w);
      setFriends(f);
      const rankIndex = lb.findIndex((e) => e.userId === profile.id);
      setLeaderboardRank(rankIndex >= 0 ? rankIndex + 1 : null);
    };
    loadData();
  }, [authLoading, profile]);

  const handleSave = async () => {
    if (!profile) return;
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedName = displayName.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (!trimmedName) { setError("Display name is required"); return; }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) { setError("Lowercase letters, numbers, and underscores only"); return; }
    setSaving(true);
    await updateProfile(profile.id, { username: trimmedUsername, display_name: trimmedName, avatar_color: selectedColor });
    await refreshProfile();
    setSaving(false);
    setError("");
  };

  const handleSignOut = async () => { await signOut(); router.push("/"); };

  if (!authLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <div className="drop-card p-8">
          <h2 className="text-xl font-black text-gray-900 mb-2">Not Signed In</h2>
          <p className="text-gray-400 text-sm mb-6">Create an account to save workouts and compete.</p>
          <Link href="/auth" className="inline-block px-8 py-3 bg-[#e8450a] text-white rounded-xl font-bold text-sm">
            Sign In / Sign Up
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || !profile) {
    return <div className="max-w-lg mx-auto px-5 py-20 text-center text-gray-400 text-sm">Loading...</div>;
  }

  const totalReps = workouts.reduce((sum, w) => sum + w.count, 0);
  const avgForm = workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.averageFormScore, 0) / workouts.length) : 0;
  const bestSession = workouts.reduce((max, w) => Math.max(max, w.count), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);

  let streak = 0;
  if (workouts.length > 0) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const workoutDates = new Set(workouts.map((w) => { const d = new Date(w.date); d.setHours(0, 0, 0, 0); return d.getTime(); }));
    const day = new Date(today);
    if (!workoutDates.has(day.getTime())) day.setDate(day.getDate() - 1);
    while (workoutDates.has(day.getTime())) { streak++; day.setDate(day.getDate() - 1); }
  }

  const challenge = getTodaysChallenge();
  const todayWorkouts = getTodaysWorkouts(workouts, profile.id);
  const challengeProgress = getChallengeProgress(challenge, todayWorkouts);
  const unlocked = getUnlockedAchievements(workouts);
  const locked = ACHIEVEMENTS.filter((a) => !unlocked.find((u) => u.id === a.id));

  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shrink-0"
          style={{ backgroundColor: profile.avatar_color }}
        >
          {profile.display_name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">{profile.display_name}</h1>
          <p className="text-gray-400 text-sm">@{profile.username}</p>
          {leaderboardRank !== null && (
            <span className="inline-flex items-center gap-1 mt-1 px-3 py-1 bg-[#e8450a] text-white rounded-full text-xs font-bold">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a.75.75 0 0 0 0 1.5h12.17a.75.75 0 0 0 0-1.5h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.707 6.707 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Z" />
              </svg>
              Rank #{leaderboardRank}
            </span>
          )}
        </div>
      </div>

      {/* Stats grid — 2x3 */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="drop-card p-4">
          <p className="text-3xl font-black text-gray-900">{totalReps.toLocaleString()}</p>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Total Reps</p>
        </div>
        <div className="drop-card p-4">
          <p className="text-3xl font-black text-gray-900">{workouts.length}</p>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Workouts</p>
        </div>
        <div className="drop-card p-4">
          <p className="text-3xl font-black text-gray-900">{bestSession}</p>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Best Set</p>
        </div>
        <div className="drop-card p-4">
          <p className="text-3xl font-black text-gray-900">{avgForm}%</p>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Avg Form</p>
        </div>
        <div className="drop-card p-4">
          <p className="text-3xl font-black text-[#e8450a]">{streak}</p>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Day Streak</p>
        </div>
        <div className="drop-card p-4">
          <p className="text-3xl font-black text-gray-900">
            {totalDuration >= 3600 ? `${Math.floor(totalDuration / 3600)}h` : `${Math.floor(totalDuration / 60)}m`}
          </p>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Total Time</p>
        </div>
      </div>

      {/* Daily challenge */}
      <div className="drop-card p-5 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-[#e8450a]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#e8450a]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">{challenge.title}</p>
            <p className="text-gray-400 text-sm">{challenge.description}</p>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${challengeProgress.completed ? "bg-green-500" : "bg-[#e8450a]"}`}
            style={{ width: `${challengeProgress.percent}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs text-right mt-1">{challengeProgress.current} / {challengeProgress.target} {challenge.unit}</p>
      </div>

      {/* Achievements */}
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Achievements</h2>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {unlocked.map((a) => (
          <div key={a.id} className="bg-[#e8450a]/10 border border-[#e8450a]/20 rounded-xl p-3 flex items-center justify-center aspect-square">
            <span className="text-2xl">{a.icon}</span>
          </div>
        ))}
        {locked.slice(0, Math.max(0, 8 - unlocked.length)).map((a) => (
          <div key={a.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-center aspect-square">
            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
            </svg>
          </div>
        ))}
      </div>

      {/* Recent Workouts */}
      {workouts.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Workouts</h2>
          <div className="space-y-2 mb-6">
            {workouts
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((w) => (
                <div key={w.id} className="drop-card flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-gray-400 text-xs">
                      {new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-gray-900 font-black text-lg">{w.count} reps</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">
                      {Math.floor(w.duration / 60)}:{(w.duration % 60).toString().padStart(2, "0")}
                    </p>
                    <p className="text-[#e8450a] font-bold text-sm">{w.averageFormScore}% form</p>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Friends */}
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Friends ({friends.length})</h2>
      {friends.length > 0 ? (
        <div className="space-y-2 mb-6">
          {friends.map((friend) => (
            <div key={friend.id} className="drop-card flex items-center gap-3 px-4 py-3.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: friend.avatarColor }}
              >
                {friend.displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-bold text-sm">{friend.displayName}</p>
                <p className="text-gray-400 text-xs">@{friend.username}</p>
              </div>
              <button
                onClick={async () => {
                  await removeFriend(profile.id, friend.id);
                  setFriends((prev) => prev.filter((f) => f.id !== friend.id));
                }}
                className="text-gray-300 hover:text-red-500 transition shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm mb-6">
          No friends yet. Add friends on the{" "}
          <Link href="/leaderboard" className="text-[#e8450a] font-medium">leaderboard</Link>.
        </p>
      )}

      {/* Settings — collapsible */}
      <div className="drop-card overflow-hidden mb-8">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full flex items-center justify-between p-5"
        >
          <span className="font-bold text-gray-900">Settings</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${settingsOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="px-5 pb-5 space-y-4">
            {/* Avatar color */}
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Avatar Color</label>
              <div className="flex gap-3">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-9 h-9 rounded-full transition-all ${
                      selectedColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-xl border border-gray-200 focus:border-[#e8450a] focus:outline-none text-sm font-medium"
              />
            </div>

            {/* Display name */}
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-xl border border-gray-200 focus:border-[#e8450a] focus:outline-none text-sm font-medium"
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-[#e8450a] text-white rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Profile"}
            </button>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-[#e8450a]/10 text-[#e8450a] rounded-xl font-bold text-sm"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
