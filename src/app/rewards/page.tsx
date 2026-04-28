"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getActiveChallenges, getChallengeProgress, Challenge, ChallengeProgress } from "@/lib/monthly-challenge";
import { getWorkouts } from "@/lib/storage";
import { WorkoutSession } from "@/types";

interface ChallengeWithProgress {
  challenge: Challenge;
  progress: ChallengeProgress;
}

export default function RewardsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const activeChallenges = getActiveChallenges();
      let workouts: WorkoutSession[] = [];

      if (profile) {
        workouts = await getWorkouts(profile.id);
      }

      const withProgress = activeChallenges.map((challenge) => ({
        challenge,
        progress: getChallengeProgress(challenge, workouts),
      }));

      setChallenges(withProgress);
      setLoading(false);
    }

    if (!authLoading) load();
  }, [profile, authLoading]);

  const daysLeft = challenges[0]?.progress.daysLeft ?? 0;

  return (
    <div
      className="max-w-lg mx-auto px-4 pb-24"
      style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Rewards</h1>
          <p className="text-gray-400 text-sm">Compete to win products from top brands</p>
        </div>
        {daysLeft > 0 && (
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg shrink-0">
            {daysLeft}d left
          </span>
        )}
      </div>

      {!profile && !authLoading && (
        <div className="drop-card p-8 text-center">
          <p className="text-gray-400 text-sm mb-3">Sign in to track your challenge progress</p>
          <a href="/auth" className="inline-block px-6 py-2.5 bg-[#e8450a] text-white rounded-lg font-bold text-sm">
            Sign In
          </a>
        </div>
      )}

      {loading && authLoading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-[#e8450a] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* How it works */}
      <div className="drop-card p-4 mb-6 bg-gray-50 border border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">How it works</p>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-start gap-2">
            <span className="text-[#e8450a] font-bold">1.</span>
            <p>Do workouts and burn calories all month</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#e8450a] font-bold">2.</span>
            <p>The user with the most calories wins the reward</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#e8450a] font-bold">3.</span>
            <p>New challenges drop every month</p>
          </div>
        </div>
      </div>

      {profile && !loading && (
        <div className="drop-card p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Your calories this month</p>
            <p className="text-2xl font-black text-[#e8450a]">
              {Math.round(challenges[0]?.progress.currentCalories ?? 0).toLocaleString()}
              <span className="text-sm text-gray-400 font-medium ml-1">cal</span>
            </p>
          </div>
          <a
            href="/workout"
            className="px-4 py-2 bg-[#e8450a] text-white rounded-lg font-bold text-sm shrink-0"
          >
            Burn More
          </a>
        </div>
      )}

      {/* Active Challenges */}
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Active Challenges
      </h2>

      <div className="space-y-4">
        {challenges.map(({ challenge }) => (
          <div key={challenge.id} className="drop-card overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <img
                  src={challenge.reward.imageUrl}
                  alt={challenge.reward.name}
                  className="w-20 h-20 rounded-xl object-contain bg-gray-50 p-2 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                    {challenge.reward.brand}
                  </p>
                  <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">
                    {challenge.reward.name}
                  </p>
                  <p className="text-xs text-[#e8450a] font-semibold mt-1">
                    Value: {challenge.reward.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">{challenge.description}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                {challenge.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
