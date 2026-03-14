"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const AVATAR_COLORS = [
  "#dc2626", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff",
];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[6]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      const trimmedUsername = username.trim().toLowerCase();
      if (!trimmedUsername || trimmedUsername.length < 3) {
        setError("Username must be at least 3 characters");
        setLoading(false);
        return;
      }
      if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
        setError("Username: lowercase letters, numbers, and underscores only");
        setLoading(false);
        return;
      }
      if (!displayName.trim()) {
        setError("Display name is required");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const result = await signUp(email, password, trimmedUsername, displayName.trim(), avatarColor);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirmSent(true);
      }
    } else {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    }
    setLoading(false);
  };

  if (confirmSent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="drop-card rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Check Your Email</h2>
          <p className="text-neutral-400 text-sm mb-6">
            We sent a confirmation link to <span className="text-white font-medium">{email}</span>. Click it to activate your account.
          </p>
          <button
            onClick={() => { setConfirmSent(false); setMode("login"); }}
            className="text-drop-500 hover:text-drop-400 text-sm font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Link href="/">
          <h1 className="text-4xl font-black tracking-tighter mb-2">
            <span className="text-white">DR</span>
            <span className="text-drop-500">O</span>
            <span className="text-white">P</span>
          </h1>
        </Link>
        <p className="text-neutral-500 text-sm">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </p>
      </div>

      <div className="drop-card rounded-2xl p-6">
        {/* Mode toggle */}
        <div className="flex gap-1 mb-6 bg-neutral-900 rounded-lg p-1">
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
              mode === "signup" ? "bg-drop-600 text-white" : "text-neutral-500 hover:text-white"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
              mode === "login" ? "bg-drop-600 text-white" : "text-neutral-500 hover:text-white"
            }`}
          >
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              {/* Avatar color picker */}
              <div className="flex justify-center gap-2 mb-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shadow-lg mr-3"
                  style={{
                    backgroundColor: avatarColor,
                    color: avatarColor === "#ffffff" ? "#0a0a0a" : "#ffffff",
                  }}
                >
                  {displayName ? displayName.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        avatarColor === color
                          ? "ring-2 ring-white ring-offset-1 ring-offset-[#0a0a0a] scale-110"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="your_username"
                  className="w-full px-3 py-2.5 bg-neutral-800 text-white rounded-lg border border-white/5 focus:border-drop-600 focus:outline-none placeholder-neutral-600 text-sm"
                  required
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
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 bg-neutral-800 text-white rounded-lg border border-white/5 focus:border-drop-600 focus:outline-none placeholder-neutral-600 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              className="w-full px-3 py-2.5 bg-neutral-800 text-white rounded-lg border border-white/5 focus:border-drop-600 focus:outline-none placeholder-neutral-600 text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-drop-400 text-xs bg-drop-600/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
