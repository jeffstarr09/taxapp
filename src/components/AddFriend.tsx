"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProfileByUsername, addFriend } from "@/lib/storage";

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

    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setMessage({ text: "Enter a username", type: "error" });
      return;
    }

    if (trimmed === profile.username.toLowerCase()) {
      setMessage({ text: "That's you!", type: "error" });
      return;
    }

    setLoading(true);
    const friend = await getProfileByUsername(trimmed);
    if (!friend) {
      setMessage({ text: "User not found", type: "error" });
      setLoading(false);
      return;
    }

    await addFriend(profile.id, friend.id);
    setMessage({ text: `Added ${friend.displayName}`, type: "success" });
    setUsername("");
    setLoading(false);
    onFriendAdded();
  };

  return (
    <div className="drop-card rounded-xl p-4">
      <h3 className="text-white font-semibold text-sm mb-3">Add Friend</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setMessage(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Enter username..."
          className="flex-1 px-3 py-2 bg-neutral-800 text-white rounded-lg border border-white/5 focus:border-drop-600 focus:outline-none placeholder-neutral-600 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-4 py-2 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "..." : "Add"}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${message.type === "success" ? "text-green-400" : "text-drop-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
