"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getWorkouts, updateProfile, getFriends, getLeaderboard, removeFriend } from "@/lib/storage";
import { getUnlockedAchievements, ACHIEVEMENTS, getTierColor, getTierTextColor } from "@/lib/achievements";
import { getTodaysChallenge, getTodaysWorkouts, getChallengeProgress } from "@/lib/challenges";
import { User, WorkoutSession } from "@/types";
import { getExerciseConfig } from "@/lib/exercise-config";

const AVATAR_COLORS = [
  "#dc2626", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff",
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
  const [leaderboardTotal, setLeaderboardTotal] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) return;

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
      setLeaderboardTotal(lb.length);
    };
    loadData();
  }, [authLoading, profile]);

  const handleSave = async () => {
    if (!profile) return;
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!trimmedName) {
      setError("Display name is required");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError("Lowercase letters, numbers, and underscores only");
      return;
    }

    setSaving(true);
    await updateProfile(profile.id, {
      username: trimmedUsername,
      display_name: trimmedName,
      avatar_color: selectedColor,
    });
    await refreshProfile();
    setSaving(false);
    setError("");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="drop-card rounded-2xl p-8">
          <h2 className="text-xl font-black text-white mb-2">Not Signed In</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Create an account to save your workouts and compete on the leaderboard.
          </p>
          <Link
            href="/auth"
            className="inline-block px-8 py-3 bg-drop-600 text-white rounded-xl hover:bg-drop-700 transition font-bold text-sm"
          >
            Sign In / Sign Up
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-20 text-neutral-500 text-sm">Loading...</div>
      </div>
    );
  }

  const totalReps = workouts.reduce((sum, w) => sum + w.count, 0);
  const avgForm =
    workouts.length > 0
      ? Math.round(workouts.reduce((sum, w) => sum + w.averageFormScore, 0) / workouts.length)
      : 0;
  const bestSession = workouts.reduce((max, w) => Math.max(max, w.count), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);

  // Streak calculation
  let streak = 0;
  if (workouts.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workoutDates = new Set(
      workouts.map((w) => {
        const d = new Date(w.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    const day = new Date(today);
    if (!workoutDates.has(day.getTime())) {
      day.setDate(day.getDate() - 1);
    }
    while (workoutDates.has(day.getTime())) {
      streak++;
      day.setDate(day.getDate() - 1);
    }
  }

  // Daily challenge
  const challenge = getTodaysChallenge();
  const todayWorkouts = getTodaysWorkouts(workouts, profile.id);
  const challengeProgress = getChallengeProgress(challenge, todayWorkouts);

  const unlocked = getUnlockedAchievements(workouts);
  const locked = ACHIEVEMENTS.filter((a) => !unlocked.find((u) => u.id === a.id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
          style={{
            backgroundColor: profile.avatar_color,
            color: profile.avatar_color === "#ffffff" ? "#0a0a0a" : "#ffffff",
          }}
        >
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-white truncate">{profile.display_name}</h1>
          <p className="text-neutral-500 text-sm">@{profile.username}</p>
          {leaderboardRank !== null && (
            <p className="text-neutral-600 text-xs mt-0.5">
              Ranked <span className="text-drop-400 font-bold">#{leaderboardRank}</span> of {leaderboardTotal}
            </p>
          )}
        </div>
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      </div>

      {/* Stats — prominent, full-width */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        <div className="drop-card rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-white">{totalReps.toLocaleString()}</p>
          <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Total Reps</p>
        </div>
        <div className="drop-card rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-white">{workouts.length}</p>
          <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Workouts</p>
        </div>
        <div className="drop-card rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-white">{bestSession}</p>
          <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Best Set</p>
        </div>
        <div className="drop-card rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-white">{avgForm}%</p>
          <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Avg Form</p>
        </div>
        <div className="drop-card rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-white">{streak}</p>
          <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Day Streak</p>
        </div>
        <div className="drop-card rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-white">
            {totalDuration >= 3600
              ? `${Math.floor(totalDuration / 3600)}h`
              : `${Math.floor(totalDuration / 60)}m`}
          </p>
          <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Time</p>
        </div>
      </div>

      {/* Daily Challenge */}
      <div className={`drop-card rounded-xl p-4 mb-6 border ${challengeProgress.completed ? "border-green-500/30" : "border-white/5"}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{challengeProgress.completed ? "✅" : "🎯"}</span>
            <div>
              <p className="text-white font-bold text-sm">{challenge.title}</p>
              <p className="text-neutral-500 text-xs">{challenge.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-black text-lg tabular-nums ${challengeProgress.completed ? "text-green-400" : "text-white"}`}>
              {challengeProgress.current}/{challengeProgress.target}
            </p>
            <p className="text-neutral-600 text-[9px] uppercase">{challenge.unit}</p>
          </div>
        </div>
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${challengeProgress.completed ? "bg-green-500" : "bg-drop-600"}`}
            style={{ width: `${challengeProgress.percent}%` }}
          />
        </div>
      </div>

      {/* Achievements */}
      <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
        Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {unlocked.map((achievement) => (
          <div
            key={achievement.id}
            className={`bg-gradient-to-br ${getTierColor(achievement.tier)} border rounded-xl p-3.5`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{achievement.icon}</span>
              <span className={`font-bold text-xs ${getTierTextColor(achievement.tier)}`}>
                {achievement.name}
              </span>
            </div>
            <p className="text-neutral-500 text-[10px]">{achievement.description}</p>
          </div>
        ))}
        {locked.map((achievement) => (
          <div
            key={achievement.id}
            className="bg-neutral-900/50 border border-white/5 rounded-xl p-3.5 opacity-40"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg grayscale">🔒</span>
              <span className="font-bold text-xs text-neutral-600">{achievement.name}</span>
            </div>
            <p className="text-neutral-700 text-[10px]">{achievement.description}</p>
          </div>
        ))}
      </div>

      {/* Workout History */}
      {workouts.length > 0 && (
        <>
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
            Workout History ({workouts.length})
          </h2>
          <div className="space-y-1.5 mb-6">
            {workouts
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-3.5 drop-card rounded-xl"
                >
                  <div>
                    <p className="text-white font-bold text-sm">
                      {workout.count} {getExerciseConfig(workout.exerciseType ?? "pushup").labelPlural.toLowerCase()}
                    </p>
                    <p className="text-neutral-600 text-xs">
                      {new Date(workout.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-white text-xs font-medium">{workout.averageFormScore}%</p>
                      <p className="text-neutral-600 text-[10px]">
                        {Math.floor(workout.duration / 60)}:{(workout.duration % 60).toString().padStart(2, "0")}
                      </p>
                    </div>
                    {workout.verified && (
                      <svg className="w-4 h-4 text-drop-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            {workouts.length > 10 && (
              <p className="text-neutral-600 text-xs text-center pt-1">
                + {workouts.length - 10} more workouts
              </p>
            )}
          </div>
        </>
      )}

      {/* Friends */}
      <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-3">
        Friends ({friends.length})
      </h2>
      {friends.length > 0 ? (
        <div className="space-y-1.5 mb-6">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-3 p-3 drop-card rounded-xl"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: friend.avatarColor }}
              >
                {friend.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{friend.displayName}</p>
                <p className="text-neutral-600 text-xs">@{friend.username}</p>
              </div>
              <button
                onClick={async () => {
                  await removeFriend(profile.id, friend.id);
                  setFriends((prev) => prev.filter((f) => f.id !== friend.id));
                }}
                className="text-neutral-600 hover:text-drop-400 transition text-xs shrink-0"
                title="Remove friend"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-600 text-sm mb-6">
          No friends yet. Add friends on the{" "}
          <Link href="/leaderboard" className="text-drop-500 hover:underline">
            leaderboard
          </Link>
          .
        </p>
      )}

      {/* Settings — collapsible */}
      <div className="drop-card rounded-2xl overflow-hidden">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium">Settings</span>
          <svg
            className={`w-4 h-4 text-neutral-500 transition-transform ${settingsOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="px-5 pb-5 space-y-4">
            {/* Avatar preview + color picker */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                style={{
                  backgroundColor: selectedColor,
                  color: selectedColor === "#ffffff" ? "#0a0a0a" : "#ffffff",
                }}
              >
                {displayName ? displayName.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      selectedColor === color
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110"
                        : "hover:scale-110 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Fields */}
            <div>
              <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                className="w-full px-3 py-2.5 bg-neutral-800 text-white rounded-lg border border-white/5 focus:border-drop-600 focus:outline-none placeholder-neutral-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2.5 bg-neutral-800 text-white rounded-lg border border-white/5 focus:border-drop-600 focus:outline-none placeholder-neutral-600 text-sm"
              />
            </div>
            {error && <p className="text-drop-400 text-xs">{error}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-bold text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Profile"}
            </button>

            <div className="pt-2 border-t border-white/5">
              <button
                onClick={handleSignOut}
                className="w-full px-6 py-2.5 text-neutral-500 rounded-lg hover:text-white hover:bg-white/5 transition text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
