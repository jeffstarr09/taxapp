"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser, setCurrentUser, getWorkouts, getUserById, seedDemoData } from "@/lib/storage";
import { User, WorkoutSession } from "@/types";

const AVATAR_COLORS = [
  "#dc2626", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff",
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
      setError("Lowercase letters, numbers, and underscores only");
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white tracking-tight mb-6">Profile</h1>

      {/* Profile form */}
      <div className="drop-card rounded-2xl p-6 mb-8">
        {/* Avatar preview */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black shadow-lg"
            style={{
              backgroundColor: selectedColor,
              color: selectedColor === "#ffffff" ? "#0a0a0a" : "#ffffff",
            }}
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
              className={`w-7 h-7 rounded-full transition-all ${
                selectedColor === color
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110"
                  : "hover:scale-110 opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3">
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
            className="w-full px-6 py-3 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-bold text-sm"
          >
            {user ? "Update Profile" : "Create Profile"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {user && (
        <>
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4">Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
            <div className="drop-card rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{totalPushups.toLocaleString()}</p>
              <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Total Reps</p>
            </div>
            <div className="drop-card rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{workouts.length}</p>
              <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Workouts</p>
            </div>
            <div className="drop-card rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">
                {workouts.reduce((max, w) => Math.max(max, w.count), 0)}
              </p>
              <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Best</p>
            </div>
            <div className="drop-card rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{avgForm}%</p>
              <p className="text-neutral-600 text-[10px] uppercase tracking-wider mt-1">Avg Form</p>
            </div>
          </div>

          {/* Recent workouts */}
          {workouts.length > 0 && (
            <>
              <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4">Recent</h2>
              <div className="space-y-1.5 mb-8">
                {workouts
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-3.5 drop-card rounded-xl"
                    >
                      <div>
                        <p className="text-white font-bold text-sm">{workout.count} reps</p>
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
              </div>
            </>
          )}

          {/* Friends */}
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4">
            Friends ({friends.length})
          </h2>
          {friends.length > 0 ? (
            <div className="space-y-1.5">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 drop-card rounded-xl"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: friend.avatarColor }}
                  >
                    {friend.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{friend.displayName}</p>
                    <p className="text-neutral-600 text-xs">@{friend.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-600 text-sm">
              No friends yet. Add friends on the{" "}
              <Link href="/leaderboard" className="text-drop-500 hover:underline">
                leaderboard
              </Link>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
