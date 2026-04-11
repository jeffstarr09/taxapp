"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const AVATAR_COLORS = [
  "#dc2626", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[6]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  // Surface OAuth errors bounced back from /auth/callback.
  // Read from window.location directly instead of useSearchParams to avoid
  // the Next.js 14 Suspense-boundary requirement during static prerender.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get("error");
    if (errParam) setError(errParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "forgot") {
      if (!email.trim()) {
        setError("Enter your email address");
        setLoading(false);
        return;
      }
      const result = await resetPassword(email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setResetSent(true);
      }
      setLoading(false);
      return;
    }

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

  const handleGoogleSignIn = async () => {
    setError("");
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
    }
  };

  // Email confirmation sent
  if (confirmSent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="drop-card rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-400 text-sm mb-6">
            We sent a confirmation link to <span className="text-gray-900 font-medium">{email}</span>. Click it to activate your account.
          </p>
          <button
            onClick={() => { setConfirmSent(false); setMode("login"); }}
            className="text-[#e8450a] text-sm font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Password reset email sent
  if (resetSent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="drop-card rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#e8450a]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#e8450a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Reset Link Sent</h2>
          <p className="text-gray-400 text-sm mb-6">
            Check <span className="text-gray-900 font-medium">{email}</span> for a password reset link.
          </p>
          <button
            onClick={() => { setResetSent(false); setMode("login"); }}
            className="text-[#e8450a] text-sm font-semibold"
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
            <span className="text-gray-900">DR</span>
            <span className="text-[#e8450a]">O</span>
            <span className="text-gray-900">P</span>
          </h1>
        </Link>
        <p className="text-gray-500 text-sm">
          {mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Reset your password"}
        </p>
      </div>

      <div className="drop-card rounded-2xl p-6">
        {/* Mode toggle — only show for login/signup */}
        {mode !== "forgot" && (
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                mode === "signup" ? "bg-[#e8450a] text-white shadow-sm" : "text-gray-500"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                mode === "login" ? "bg-[#e8450a] text-white shadow-sm" : "text-gray-500"
              }`}
            >
              Log In
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className="flex items-center gap-1 text-gray-400 text-sm mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Login
          </button>
        )}

        {/* Google sign-in */}
        {mode !== "forgot" && (
          <>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              {/* Avatar color picker */}
              <div className="flex justify-center gap-2 mb-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shadow-lg mr-3"
                  style={{
                    backgroundColor: avatarColor,
                    color: avatarColor === "#6b7280" ? "#ffffff" : "#ffffff",
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
                          ? "ring-2 ring-gray-400 ring-offset-2 scale-110"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="your_username"
                  className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-[#e8450a] focus:outline-none placeholder-gray-400 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-[#e8450a] focus:outline-none placeholder-gray-400 text-sm"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-[#e8450a] focus:outline-none placeholder-gray-400 text-sm"
              required
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-[#e8450a] focus:outline-none placeholder-gray-400 text-sm"
                required
              />
            </div>
          )}

          {/* Forgot password link */}
          {mode === "login" && (
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(""); }}
              className="text-[#e8450a] text-xs font-medium"
            >
              Forgot password?
            </button>
          )}

          {error && (
            <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#e8450a] text-white rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading
              ? "..."
              : mode === "signup"
                ? "Create Account"
                : mode === "login"
                  ? "Log In"
                  : "Send Reset Link"}
          </button>
        </form>
      </div>

      {/* Legal links — required for Google OAuth verification */}
      <p className="text-center text-xs text-gray-400 mt-6">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-[#e8450a] hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-[#e8450a] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
