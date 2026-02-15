"use client";

import { useState } from "react";
import { getUserByUsername, addFriend, getCurrentUser, setCurrentUser } from "@/lib/storage";

interface AddFriendProps {
  onFriendAdded: () => void;
}

export default function AddFriend({ onFriendAdded }: AddFriendProps) {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleAdd = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setMessage({ text: "Create a profile first", type: "error" });
      return;
    }

    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setMessage({ text: "Enter a username", type: "error" });
      return;
    }

    if (trimmed === currentUser.username.toLowerCase()) {
      setMessage({ text: "That's you!", type: "error" });
      return;
    }

    const friend = getUserByUsername(trimmed);
    if (!friend) {
      setMessage({ text: "User not found", type: "error" });
      return;
    }

    if (currentUser.friends.includes(friend.id)) {
      setMessage({ text: "Already friends", type: "error" });
      return;
    }

    addFriend(currentUser.id, friend.id);
    const updated = { ...currentUser, friends: [...currentUser.friends, friend.id] };
    setCurrentUser(updated);

    setMessage({ text: `Added ${friend.displayName}`, type: "success" });
    setUsername("");
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
          className="px-4 py-2 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-semibold text-sm"
        >
          Add
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${message.type === "success" ? "text-green-400" : "text-drop-400"}`}>
          {message.text}
        </p>
      )}
      <p className="text-neutral-600 text-xs mt-2">
        Try: fitfiona, pushupping, ironarms, repcounter, dailyreps
      </p>
    </div>
  );
}
