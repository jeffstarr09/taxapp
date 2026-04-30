"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { MOTIVATION_TIERS, MotivationTier, setMotivationTier } from "@/lib/motivation";
import { registerPushNotifications } from "@/lib/push-notifications";
import { isNative } from "@/lib/native";

// One-time prompt that picks the user's streak-reminder tone AND
// drives the iOS push-permission request with clear in-app context
// (instead of asking for push silently right after login, which Apple
// reviewers flag under Guideline 4.5.4).
//
// Shown once per signed-in user, once decided (any of the four tiles)
// the choice is persisted and the modal never reappears for that user.
export default function NotificationPreferencePrompt() {
  const { profile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!profile?.id) return;
    if (!isNative()) return; // Web users get no push — skip entirely
    const key = `drop_notif_pref_${profile.id}`;
    if (localStorage.getItem(key)) return;
    // Slight delay so we don't slam the user the instant the home screen renders
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [profile, loading]);

  const persist = (value: string) => {
    if (!profile?.id) return;
    localStorage.setItem(`drop_notif_pref_${profile.id}`, value);
  };

  const handlePickTone = async (tier: MotivationTier) => {
    if (!profile?.id) return;
    setSubmitting(tier);
    setMotivationTier(tier);
    persist(tier);
    try {
      await registerPushNotifications(profile.id);
    } catch {
      // If permission is denied at the OS level the registration call
      // resolves false; nothing to do here. The user already chose their
      // tone, which still applies to in-app messaging.
    }
    setOpen(false);
    setSubmitting(null);
  };

  const handleDecline = () => {
    persist("none");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-black text-gray-900 mb-1">
          Pick your reminder style
        </h2>
        <p className="text-gray-500 text-sm mb-5">
          We&apos;ll send you a short streak reminder if you haven&apos;t worked
          out for the day. Pick the tone that motivates you most.
        </p>

        <div className="space-y-2 mb-3">
          {MOTIVATION_TIERS.map((t) => (
            <button
              key={t.value}
              onClick={() => handlePickTone(t.value)}
              disabled={submitting !== null}
              className="w-full flex items-start gap-3 text-left p-4 rounded-2xl border border-gray-200 hover:border-[#e8450a] hover:bg-[#e8450a]/5 transition disabled:opacity-50"
            >
              <div className="flex-1">
                <p className="font-bold text-gray-900">{t.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t.description}</p>
              </div>
              {submitting === t.value && (
                <div className="w-4 h-4 border-2 border-[#e8450a] border-t-transparent rounded-full animate-spin shrink-0 mt-1" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleDecline}
          disabled={submitting !== null}
          className="w-full text-gray-400 text-sm py-3 disabled:opacity-50"
        >
          No notifications, thanks
        </button>
      </div>
    </div>
  );
}
