"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProfileByUsername, addFriend, getFriendIds } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";

interface AddFriendProps {
  onFriendAdded: () => void;
}

export default function AddFriend({ onFriendAdded }: AddFriendProps) {
  const { profile } = useAuth();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!profile) {
      setMessage({ text: "Sign in first", type: "error" });
      return;
    }

    const trimmed = username.trim().toLowerCase().replace(/^@/, "");
    if (!trimmed) {
      setMessage({ text: "Enter a username", type: "error" });
      return;
    }

    if (trimmed === profile.username.toLowerCase()) {
      setMessage({ text: "That's you!", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const friend = await getProfileByUsername(trimmed);
      if (!friend) {
        setMessage({ text: "User not found — check the spelling", type: "error" });
        setLoading(false);
        return;
      }

      // Check if already friends
      const existingFriends = await getFriendIds(profile.id);
      if (existingFriends.includes(friend.id)) {
        setMessage({ text: `You're already friends with ${friend.displayName}`, type: "error" });
        setLoading(false);
        return;
      }

      await addFriend(profile.id, friend.id);
      trackEvent("friend_added");
      setMessage({ text: `Added ${friend.displayName}!`, type: "success" });
      setUsername("");
      onFriendAdded();
    } catch {
      setMessage({ text: "Something went wrong — try again", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setMessage(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Search @username"
            className="w-full pl-9 pr-3 py-3 bg-white text-gray-900 rounded-xl border border-gray-200 focus:border-[#e8450a] focus:outline-none placeholder-gray-400 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-5 py-3 bg-[#e8450a] text-white rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "..." : "Add"}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
