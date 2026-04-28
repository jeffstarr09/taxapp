"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getWorkouts, updateProfile, getFriends, getLeaderboard, removeFriend } from "@/lib/storage";
import { getUnlockedAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { getTodaysChallenge, getTodaysWorkouts, getChallengeProgress } from "@/lib/challenges";
import { User, WorkoutSession } from "@/types";
import { computeStreak } from "@/lib/streaks";
import { getExerciseConfig } from "@/lib/exercise-config";
import { totalCalories, caloriesForReps } from "@/lib/calories";
import Avatar from "@/components/Avatar";
import AvatarUpload from "@/components/AvatarUpload";
import LegalFooter from "@/components/LegalFooter";
import { getReferralUrl } from "@/lib/referrals";
import { getMotivationTier, setMotivationTier, MOTIVATION_TIERS, MotivationTier } from "@/lib/motivation";

export default function ProfilePage() {
  const { profile, user, loading: authLoading, signOut, deleteAccount, refreshProfile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [motivationTier, setMotivationTierState] = useState<MotivationTier>("motivational");

  useEffect(() => {
    if (authLoading || !profile) return;
    setUsername(profile.username);
    setDisplayName(profile.display_name);
    setMotivationTierState(getMotivationTier());

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
    await updateProfile(profile.id, { username: trimmedUsername, display_name: trimmedName });
    await refreshProfile();
    setSaving(false);
    setError("");
  };

  const handleSignOut = async () => { await signOut(); router.push("/"); };

  if (!authLoading && !user) {
    return (
      <div
        className="max-w-lg mx-auto px-5 pb-16 text-center"
        style={{ paddingTop: "calc(4rem + env(safe-area-inset-top))" }}
      >
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
    return (
      <div
        className="max-w-lg mx-auto px-5 pb-20 text-center text-gray-400 text-sm"
        style={{ paddingTop: "calc(5rem + env(safe-area-inset-top))" }}
      >
        Loading...
      </div>
    );
  }

  const totalReps = workouts.reduce((sum, w) => sum + w.count, 0);
  const avgForm = workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.averageFormScore, 0) / workouts.length) : 0;
  const bestSession = workouts.reduce((max, w) => Math.max(max, w.count), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
  const calories = totalCalories(workouts);

  const { count: streak } = computeStreak(workouts);

  // Per-exercise breakdown
  const exerciseBreakdown = (["pushup", "situp", "squat"] as const).map((type) => {
    const exWorkouts = workouts.filter((w) => w.exerciseType === type);
    const config = getExerciseConfig(type);
    return {
      type,
      label: config.labelPlural,
      reps: exWorkouts.reduce((sum, w) => sum + w.count, 0),
      sessions: exWorkouts.length,
      calories: totalCalories(exWorkouts),
    };
  }).filter((e) => e.reps > 0);

  const challenge = getTodaysChallenge();
  const todayWorkouts = getTodaysWorkouts(workouts, profile.id);
  const challengeProgress = getChallengeProgress(challenge, todayWorkouts);
  const unlocked = getUnlockedAchievements(workouts);
  const locked = ACHIEVEMENTS.filter((a) => !unlocked.find((u) => u.id === a.id));

  return (
    <div
      className="max-w-lg mx-auto px-5"
      style={{ paddingTop: "calc(2rem + env(safe-area-inset-top))" }}
    >
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar
          displayName={profile.display_name}
          avatarColor={profile.avatar_color}
          avatarUrl={profile.avatar_url}
          size="xl"
        />
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

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="drop-card p-4 text-center">
          <p className="text-2xl font-black text-[#e8450a]">{Math.round(calories).toLocaleString()}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Calories</p>
        </div>
        <div className="drop-card p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{totalReps.toLocaleString()}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Total Reps</p>
        </div>
        <div className="drop-card p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{streak}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Day Streak</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="drop-card p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{workouts.length}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Workouts</p>
        </div>
        <div className="drop-card p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{avgForm}%</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Avg Form</p>
        </div>
        <div className="drop-card p-4 text-center">
          <p className="text-2xl font-black text-gray-900">
            {totalDuration >= 3600 ? `${Math.floor(totalDuration / 3600)}h` : `${Math.floor(totalDuration / 60)}m`}
          </p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Total Time</p>
        </div>
      </div>

      {/* Per-exercise breakdown */}
      {exerciseBreakdown.length > 1 && (
        <>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">By Exercise</h2>
          <div className="space-y-2 mb-6">
            {exerciseBreakdown.map((ex) => (
              <div key={ex.type} className="drop-card flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-gray-900 font-bold text-sm">{ex.label}</p>
                  <p className="text-gray-400 text-xs">{ex.sessions} sessions</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-black">{ex.reps.toLocaleString()} reps</p>
                  <p className="text-[#e8450a] text-xs font-semibold">{Math.round(ex.calories)} cal</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
                      {" · "}
                      {getExerciseConfig(w.exerciseType).labelPlural}
                    </p>
                    <p className="text-gray-900 font-black text-lg">{w.count} reps</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#e8450a] font-bold text-sm">{caloriesForReps(w.exerciseType, w.count)} cal</p>
                    <p className="text-gray-400 text-xs">{w.averageFormScore}% form</p>
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
              <Avatar
                displayName={friend.displayName}
                avatarColor={friend.avatarColor}
                avatarUrl={friend.avatarUrl}
                size="md"
              />
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

      {/* Invite friends */}
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Invite Friends</h2>
      <div className="drop-card p-5 mb-6">
        <p className="text-gray-700 text-sm mb-1 font-medium">Challenge your friends to join DROP</p>
        <p className="text-gray-400 text-xs mb-3">Share your invite link and compete together.</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={getReferralUrl(profile.id)}
            className="flex-1 px-3 py-2.5 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-xs font-mono truncate"
          />
          <button
            onClick={() => {
              const url = getReferralUrl(profile.id);
              if (navigator.share) {
                navigator.share({ title: "Join me on DROP", text: "Try DROP — the AI-powered workout counter!", url });
              } else {
                navigator.clipboard.writeText(url);
              }
            }}
            className="px-4 py-2.5 bg-[#e8450a] text-white rounded-lg font-bold text-xs shrink-0"
          >
            Share
          </button>
        </div>
      </div>

      {/* Shareable profile link */}
      <div className="drop-card p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-gray-700 text-sm font-medium">Your public profile</p>
          <p className="text-[#e8450a] text-xs font-mono">dropfit.app/u/{profile.username}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`)}
          className="px-3 py-2 bg-gray-100 rounded-lg text-gray-500 text-xs font-medium hover:bg-gray-200 transition"
        >
          Copy
        </button>
      </div>

      {/* Motivation style */}
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Motivation Style</h2>
      <div className="drop-card p-1 mb-6">
        <div className="grid grid-cols-3 gap-1">
          {MOTIVATION_TIERS.map((tier) => (
            <button
              key={tier.value}
              onClick={() => {
                setMotivationTier(tier.value);
                setMotivationTierState(tier.value);
              }}
              className={`py-3 px-2 rounded-xl text-center transition ${
                motivationTier === tier.value
                  ? "bg-[#e8450a] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <p className={`text-sm font-bold ${motivationTier === tier.value ? "text-white" : "text-gray-900"}`}>
                {tier.value === "motivational" ? "🤗" : tier.value === "push_me" ? "😤" : "💀"}
              </p>
              <p className={`text-xs font-semibold mt-0.5 ${motivationTier === tier.value ? "text-white" : "text-gray-700"}`}>
                {tier.label}
              </p>
              <p className={`text-[10px] mt-0.5 ${motivationTier === tier.value ? "text-white/70" : "text-gray-400"}`}>
                {tier.description}
              </p>
            </button>
          ))}
        </div>
      </div>

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
            {/* Avatar photo */}
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Profile Photo</label>
              <AvatarUpload
                currentUrl={profile.avatar_url}
                avatarColor={profile.avatar_color}
                displayName={displayName}
                onCapture={async (dataUrl) => {
                  await updateProfile(profile.id, { avatar_url: dataUrl });
                  await refreshProfile();
                }}
                onRemove={async () => {
                  await updateProfile(profile.id, { avatar_url: null });
                  await refreshProfile();
                }}
              />
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

            {/* Delete account */}
            <div className="pt-4 border-t border-gray-100">
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full py-3 text-gray-400 text-sm font-medium"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-500 text-xs text-center">
                    This will permanently delete your account, all workouts, and stats. This cannot be undone.
                  </p>
                  <button
                    onClick={async () => {
                      setDeleting(true);
                      const result = await deleteAccount();
                      if (result.error) {
                        setError(result.error);
                        setDeleting(false);
                      } else {
                        router.push("/");
                      }
                    }}
                    disabled={deleting}
                    className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Yes, Delete My Account"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="w-full py-2 text-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <LegalFooter />
    </div>
  );
}
