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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("global")}
          className={`px-6 py-2.5 rounded-xl font-medium transition ${
            tab === "global"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setTab("friends")}
          className={`px-6 py-2.5 rounded-xl font-medium transition ${
            tab === "friends"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          Friends
        </button>
      </div>

      {/* Friends tab extras */}
      {tab === "friends" && (
        <div className="mb-6">
          <AddFriend onFriendAdded={loadData} />
        </div>
      )}

      {/* Leaderboard table */}
      <LeaderboardTable entries={entries} currentUserId={user?.id} />

      {/* No profile notice */}
      {!user && (
        <div className="mt-8 bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700/50">
          <p className="text-gray-300 mb-2">Create a profile to track your ranking</p>
          <a
            href="/profile"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Create Profile
          </a>
        </div>
      )}
    </div>
  );
}
