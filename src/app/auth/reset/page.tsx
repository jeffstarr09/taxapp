"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="drop-card rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Password Updated</h2>
          <p className="text-gray-400 text-sm">Redirecting you home...</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="drop-card rounded-2xl p-8">
          <h2 className="text-xl font-black text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-400 text-sm mb-4">Loading your session...</p>
          <p className="text-gray-400 text-xs">If this takes too long, try requesting a new reset link.</p>
          <Link href="/auth" className="text-[#e8450a] text-sm font-semibold mt-4 inline-block">
            Back to Login
          </Link>
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
        <p className="text-gray-500 text-sm">Set your new password</p>
      </div>

      <div className="drop-card rounded-2xl p-6">
        <form onSubmit={handleReset} className="space-y-3">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-[#e8450a] focus:outline-none placeholder-gray-400 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-[#e8450a] focus:outline-none placeholder-gray-400 text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#e8450a] text-white rounded-lg font-bold text-sm disabled:opacity-50 mt-2"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
