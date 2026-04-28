"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProfileByUsername, getWorkouts } from "@/lib/storage";
import { User, WorkoutSession } from "@/types";
import { totalCalories } from "@/lib/calories";
import { computeStreak } from "@/lib/streaks";
import { getExerciseConfig } from "@/lib/exercise-config";
import { getUnlockedAchievements } from "@/lib/achievements";
import Avatar from "@/components/Avatar";

export default function ProfileClient() {
  const params = useParams();
  const username = params.username as string;
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getProfileByUsername(username);
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfileUser(p);
      const w = await getWorkouts(p.id);
      setWorkouts(w);
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#e8450a] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (notFound || !profileUser) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <div className="drop-card p-8">
          <h2 className="text-xl font-black text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-400 text-sm mb-6">@{username} doesn&apos;t exist on DROP.</p>
          <Link href="/" className="inline-block px-8 py-3 bg-[#e8450a] text-white rounded-xl font-bold text-sm">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const totalReps = workouts.reduce((sum, w) => sum + w.count, 0);
  const calories = totalCalories(workouts);
  const { count: streak } = computeStreak(workouts);
  const avgForm = workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.averageFormScore, 0) / workouts.length) : 0;
  const unlocked = getUnlockedAchievements(workouts);

  const exerciseBreakdown = (["pushup", "situp", "squat"] as const).map((type) => {
    const exWorkouts = workouts.filter((w) => w.exerciseType === type);
    return {
      type,
      label: getExerciseConfig(type).labelPlural,
      reps: exWorkouts.reduce((sum, w) => sum + w.count, 0),
      sessions: exWorkouts.length,
      calories: totalCalories(exWorkouts),
    };
  }).filter((e) => e.reps > 0);

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-24">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar
          displayName={profileUser.displayName}
          avatarColor={profileUser.avatarColor}
          avatarUrl={profileUser.avatarUrl}
          size="xl"
        />
        <div>
          <h1 className="text-2xl font-black text-gray-900">{profileUser.displayName}</h1>
          <p className="text-gray-400 text-sm">@{profileUser.username}</p>
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
          <p className="text-2xl font-black text-gray-900">{unlocked.length}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Badges</p>
        </div>
      </div>

      {/* Exercise breakdown */}
      {exerciseBreakdown.length > 0 && (
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

      {/* Achievements */}
      {unlocked.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Achievements</h2>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {unlocked.map((a) => (
              <div key={a.id} className="bg-[#e8450a]/10 border border-[#e8450a]/20 rounded-xl p-3 flex items-center justify-center aspect-square">
                <span className="text-2xl">{a.icon}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CTA to join */}
      <div className="drop-card p-6 text-center bg-gradient-to-b from-[#e8450a]/5 to-transparent">
        <p className="text-gray-900 font-bold mb-1">Think you can beat {profileUser.displayName.split(" ")[0]}?</p>
        <p className="text-gray-400 text-sm mb-4">Join DROP and start competing.</p>
        <Link href="/auth" className="inline-block px-8 py-3 bg-[#e8450a] text-white rounded-xl font-bold text-sm">
          Get Started
        </Link>
      </div>
    </div>
  );
}
