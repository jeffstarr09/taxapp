"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { searchProfiles, addFriend, getFriendIds } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { User } from "@/types";
import Avatar from "@/components/Avatar";

interface AddFriendProps {
  onFriendAdded: () => void;
}

export default function AddFriend({ onFriendAdded }: AddFriendProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing friend IDs on mount
  useEffect(() => {
    if (!profile) return;
    getFriendIds(profile.id).then((ids) => setFriendIds(new Set(ids)));
  }, [profile]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const users = await searchProfiles(trimmed, 8);
      // Filter out self
      const filtered = users.filter((u) => u.id !== profile?.id);
      setResults(filtered);
      setShowDropdown(filtered.length > 0);
      setSearching(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, profile?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleAdd = async (user: User) => {
    if (!profile) return;
    if (friendIds.has(user.id)) {
      setMessage({ text: `Already friends with ${user.displayName}`, type: "error" });
      return;
    }

    setAddingId(user.id);
    try {
      await addFriend(profile.id, user.id);
      trackEvent("friend_added");
      setFriendIds((prev) => new Set(prev).add(user.id));
      setMessage({ text: `Added ${user.displayName}!`, type: "success" });
      setQuery("");
      setResults([]);
      setShowDropdown(false);
      onFriendAdded();
    } catch {
      setMessage({ text: "Something went wrong — try again", type: "error" });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMessage(null);
          }}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          placeholder="Search by name or username"
          className="w-full pl-9 pr-3 py-3 bg-white text-gray-900 rounded-xl border border-gray-200 focus:border-[#e8450a] focus:outline-none placeholder-gray-400 text-sm"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#e8450a] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {results.map((user) => {
            const alreadyFriend = friendIds.has(user.id);
            const isAdding = addingId === user.id;
            return (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
              >
                <Avatar
                  displayName={user.displayName}
                  avatarColor={user.avatarColor}
                  avatarUrl={user.avatarUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm truncate">{user.displayName}</p>
                  <p className="text-gray-400 text-xs truncate">@{user.username}</p>
                </div>
                {alreadyFriend ? (
                  <span className="text-gray-400 text-xs font-medium shrink-0">Friends</span>
                ) : (
                  <button
                    onClick={() => handleAdd(user)}
                    disabled={isAdding}
                    className="px-3 py-1.5 bg-[#e8450a] text-white rounded-lg text-xs font-semibold disabled:opacity-50 shrink-0"
                  >
                    {isAdding ? "..." : "Add"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {message && (
        <p className={`mt-2 text-xs ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
