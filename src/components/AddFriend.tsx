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
      setMessage({ text: "Please create a profile first", type: "error" });
      return;
    }

    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setMessage({ text: "Enter a username", type: "error" });
      return;
    }

    if (trimmed === currentUser.username.toLowerCase()) {
      setMessage({ text: "You can't add yourself!", type: "error" });
      return;
    }

    const friend = getUserByUsername(trimmed);
    if (!friend) {
      setMessage({ text: "User not found", type: "error" });
      return;
    }

    if (currentUser.friends.includes(friend.id)) {
      setMessage({ text: "Already friends!", type: "error" });
      return;
    }

    addFriend(currentUser.id, friend.id);

    // Refresh current user
    const updated = { ...currentUser, friends: [...currentUser.friends, friend.id] };
    setCurrentUser(updated);

    setMessage({ text: `Added ${friend.displayName} as friend!`, type: "success" });
    setUsername("");
    onFriendAdded();
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-3">Add Friend</h3>
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
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Add
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
      <p className="text-gray-500 text-xs mt-2">
        Try: fitfiona, pushupping, ironarms, repcounter, dailyreps
      </p>
    </div>
  );
}
