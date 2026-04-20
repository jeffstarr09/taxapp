"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import Podium from "@/components/Podium";
import AddFriend from "@/components/AddFriend";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard, getWorkouts, getFriendIds } from "@/lib/storage";
import { LeaderboardEntry, ExerciseType, LeaderboardPeriod } from "@/types";
import { getTodaysChallenge, getTodaysWorkouts, getChallengeProgress } from "@/lib/challenges";
import { formatCountdown, msUntilNextWeek } from "@/lib/period";

type Scope = "global" | "friends";

export default function LeaderboardPage() {
  const { profile, loading: authLoading } = useAuth();

  const [scope, setScope] = useState<Scope>("global");
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const [scopeResolved, setScopeResolved] = useState(false);

  const [exerciseType] = useState<ExerciseType>("pushup");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const [challengeProgress, setChallengeProgress] = useState<{
    current: number;
    target: number;
    completed: boolean;
    percent: number;
  } | null>(null);
  const [todaysChallenge] = useState(getTodaysChallenge);

  // On first load (once auth settles), pick the smart scope default:
  // Friends if the user has any, otherwise Global.
  useEffect(() => {
    if (authLoading) return;
    if (scopeResolved) return;
    (async () => {
      if (profile?.id) {
        const friendIds = await getFriendIds(profile.id);
        setScope(friendIds.length > 0 ? "friends" : "global");
      } else {
        setScope("global");
      }
      setScopeResolved(true);
    })();
  }, [authLoading, profile, scopeResolved]);

  const loadData = useCallback(async () => {
    const leaderboard = await getLeaderboard(
      scope === "friends",
      profile?.id,
      exerciseType,
      period
    );
    setEntries(leaderboard);

    if (period === "today" && profile?.id) {
      const allWorkouts = await getWorkouts(profile.id);
      const todayW = getTodaysWorkouts(allWorkouts, profile.id);
      setChallengeProgress(getChallengeProgress(todaysChallenge, todayW));
    } else {
      setChallengeProgress(null);
    }
  }, [scope, period, profile, exerciseType, todaysChallenge]);

  useEffect(() => {
    if (authLoading) return;
    if (!scopeResolved) return;
    loadData();
  }, [loadData, authLoading, scopeResolved]);

  // Live countdown to the next week reset. Ticks every 30s — plenty
  // granular for a "3d 12h" style display and low overhead.
  const [weekCountdown, setWeekCountdown] = useState(() => formatCountdown(msUntilNextWeek()));
  useEffect(() => {
    const id = setInterval(() => {
      setWeekCountdown(formatCountdown(msUntilNextWeek()));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Hours remaining in the day (for the daily challenge card)
  const hoursLeft = 24 - new Date().getHours();

  const showAddFriend = scope === "friends";
  const showContestBanner = period === "week";

  const subtitle = useMemo(() => {
    switch (period) {
      case "today":
        return "Today's reps";
      case "week":
        return "This week's contest";
      case "month":
        return "This month's totals";
      case "all":
        return "All-time totals";
    }
  }, [period]);

  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-3xl font-black text-gray-900">Leaderboard</h1>
      </div>
      <p className="text-gray-400 text-sm mb-5">{subtitle}</p>

      {/* Weekly contest banner with live countdown */}
      {showContestBanner && (
        <div className="drop-card p-4 mb-5 bg-gradient-to-r from-[#e8450a]/5 to-transparent border-[#e8450a]/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e8450a]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#e8450a]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Weekly contest</p>
              <p className="text-gray-500 text-xs">Resets Monday at midnight</p>
            </div>
            <div className="text-right">
              <p className="text-[#e8450a] font-black text-base tabular-nums leading-none">{weekCountdown}</p>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider mt-0.5">remaining</p>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown filters */}
      <div className="flex gap-2 mb-5">
        <DropdownSelect
          value={scope}
          onChange={(v) => setScope(v as Scope)}
          options={[
            { value: "global", label: "Global" },
            { value: "friends", label: "Friends" },
          ]}
        />
        <DropdownSelect
          value={period}
          onChange={(v) => setPeriod(v as LeaderboardPeriod)}
          options={[
            { value: "today", label: "Today" },
            { value: "week", label: "This Week" },
            { value: "month", label: "This Month" },
            { value: "all", label: "All Time" },
          ]}
        />
      </div>

      {/* Friends scope — search */}
      {showAddFriend && (
        <div className="mb-4">
          <AddFriend onFriendAdded={loadData} />
        </div>
      )}

      {/* Daily challenge — only when viewing Today */}
      {period === "today" && challengeProgress && (
        <div className="drop-card p-5 mb-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-[#e8450a]/10 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#e8450a]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{todaysChallenge.title}</p>
              <p className="text-gray-400 text-sm">{todaysChallenge.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="font-bold text-gray-900">
              {challengeProgress.current} / {challengeProgress.target}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                challengeProgress.completed ? "bg-green-500" : "bg-[#e8450a]"
              }`}
              style={{ width: `${challengeProgress.percent}%` }}
            />
          </div>
          <p className="text-gray-400 text-xs text-right mt-1.5">Expires in {hoursLeft}h</p>
        </div>
      )}

      {/* Podium */}
      {entries.length >= 3 && <Podium entries={entries} currentUserId={profile?.id} />}

      {/* Table for rank 4+ */}
      <LeaderboardTable
        entries={entries}
        currentUserId={profile?.id}
        startRank={entries.length >= 3 ? 3 : 0}
      />

      {!profile && (
        <div className="mt-8 drop-card p-6 text-center">
          <p className="text-gray-400 text-sm mb-3">Create an account to track your ranking</p>
          <a
            href="/auth"
            className="inline-block px-6 py-2.5 bg-[#e8450a] text-white rounded-xl font-semibold text-sm"
          >
            Sign In
          </a>
        </div>
      )}
    </div>
  );
}

interface DropdownSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function DropdownSelect({ value, onChange, options }: DropdownSelectProps) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-9 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#e8450a] focus:ring-1 focus:ring-[#e8450a]/30 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}
