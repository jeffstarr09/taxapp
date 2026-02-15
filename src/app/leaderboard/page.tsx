"use client";

import { useState, useEffect, useCallback } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import AddFriend from "@/components/AddFriend";
import { getLeaderboard, getCurrentUser, seedDemoData } from "@/lib/storage";
import { LeaderboardEntry, User } from "@/types";

type TabType = "global" | "friends";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<TabType>("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const loadData = useCallback(() => {
    seedDemoData();
    const currentUser = getCurrentUser();
    setUser(currentUser);

    const leaderboard = getLeaderboard(
      tab === "friends",
      currentUser?.id
    );
    setEntries(leaderboard);
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white tracking-tight mb-6">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6">
        <button
          onClick={() => setTab("global")}
          className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
            tab === "global"
              ? "bg-drop-600 text-white"
              : "bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800"
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setTab("friends")}
          className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${
            tab === "friends"
              ? "bg-drop-600 text-white"
              : "bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800"
          }`}
        >
          Friends
        </button>
      </div>

      {tab === "friends" && (
        <div className="mb-6">
          <AddFriend onFriendAdded={loadData} />
        </div>
      )}

      <LeaderboardTable entries={entries} currentUserId={user?.id} />

      {!user && (
        <div className="mt-8 drop-card rounded-xl p-6 text-center">
          <p className="text-neutral-400 text-sm mb-3">Create a profile to track your ranking</p>
          <a
            href="/profile"
            className="inline-block px-6 py-2.5 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-semibold text-sm"
          >
            Create Profile
          </a>
        </div>
      )}
    </div>
  );
}
