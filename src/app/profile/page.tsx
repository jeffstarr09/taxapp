"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser, setCurrentUser, getWorkouts, getUserById, seedDemoData } from "@/lib/storage";
import { User, WorkoutSession } from "@/types";

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a855f7",
];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    seedDemoData();
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setUsername(currentUser.username);
      setDisplayName(currentUser.displayName);
      setSelectedColor(currentUser.avatarColor);
      setWorkouts(getWorkouts(currentUser.id));
      setFriends(
        currentUser.friends
          .map((id) => getUserById(id))
          .filter((u): u is User => u !== undefined)
      );
    }
  }, []);

  const handleSave = () => {
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
      setError("Username can only contain lowercase letters, numbers, and underscores");
      return;
    }

    const newUser: User = user
      ? { ...user, username: trimmedUsername, displayName: trimmedName, avatarColor: selectedColor }
      : {
          id: uuidv4(),
          username: trimmedUsername,
          displayName: trimmedName,
          avatarColor: selectedColor,
          createdAt: new Date().toISOString(),
          friends: [],
        };

    setCurrentUser(newUser);
    setUser(newUser);
    setError("");
  };

  const totalPushups = workouts.reduce((sum, w) => sum + w.count, 0);
  const avgForm =
    workouts.length > 0
      ? Math.round(workouts.reduce((sum, w) => sum + w.averageFormScore, 0) / workouts.length)
      : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Profile</h1>

      {/* Profile form */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
        {/* Avatar preview */}
        <div className="flex justify-center mb-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
            style={{ backgroundColor: selectedColor }}
          >
            {displayName ? displayName.charAt(0).toUpperCase() : "?"}
          </div>
        </div>

        {/* Color picker */}
        <div className="flex justify-center gap-2 mb-6">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full transition-transform ${
                selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : "hover:scale-110"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="your_username"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            {user ? "Update Profile" : "Create Profile"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {user && (
        <>
          <h2 className="text-xl font-bold text-white mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
              <p className="text-2xl font-bold text-white">{totalPushups.toLocaleString()}</p>
              <p className="text-gray-400 text-xs mt-1">Total Reps</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
              <p className="text-2xl font-bold text-white">{workouts.length}</p>
              <p className="text-gray-400 text-xs mt-1">Workouts</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
              <p className="text-2xl font-bold text-white">
                {workouts.reduce((max, w) => Math.max(max, w.count), 0)}
              </p>
              <p className="text-gray-400 text-xs mt-1">Best Session</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
              <p className="text-2xl font-bold text-white">{avgForm}%</p>
              <p className="text-gray-400 text-xs mt-1">Avg Form</p>
            </div>
          </div>

          {/* Recent workouts */}
          {workouts.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-white mb-4">Recent Workouts</h2>
              <div className="space-y-2 mb-8">
                {workouts
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
                    >
                      <div>
                        <p className="text-white font-semibold">{workout.count} push-ups</p>
                        <p className="text-gray-500 text-sm">
                          {new Date(workout.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white text-sm">{workout.averageFormScore}% form</p>
                          <p className="text-gray-500 text-xs">
                            {Math.floor(workout.duration / 60)}:{(workout.duration % 60).toString().padStart(2, "0")}
                          </p>
                        </div>
                        {workout.verified && (
                          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Friends list */}
          <h2 className="text-xl font-bold text-white mb-4">Friends ({friends.length})</h2>
          {friends.length > 0 ? (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: friend.avatarColor }}
                  >
                    {friend.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{friend.displayName}</p>
                    <p className="text-gray-500 text-sm">@{friend.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No friends yet. Add friends on the{" "}
              <Link href="/leaderboard" className="text-blue-400 hover:underline">
                leaderboard page
              </Link>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
