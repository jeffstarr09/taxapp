"use client";

import { useEffect, useState } from "react";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-prefs";

interface Props {
  userId: string;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function hourLabel(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export default function NotificationSettings({ userId }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPreferences(userId).then(setPrefs);
  }, [userId]);

  const sendTest = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setTestStatus(json.error ?? "Failed to send");
      } else if (json.skipped) {
        setTestStatus(json.reason === "no active tokens"
          ? "No device registered yet. Open the iOS app and grant notifications."
          : `Skipped: ${json.reason}`);
      } else {
        setTestStatus("Sent! Check your iPhone.");
      }
    } catch {
      setTestStatus("Network error");
    } finally {
      setTesting(false);
    }
  };

  const update = async (patch: Partial<Omit<NotificationPreferences, "user_id">>) => {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    await updateNotificationPreferences(userId, patch);
    setSaving(false);
  };

  if (!prefs) {
    return (
      <div className="drop-card p-5 text-center text-gray-400 text-sm">
        Loading notification settings…
      </div>
    );
  }

  const toggles: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
    { key: "streak_reminders", label: "Streak reminders", description: "Nudges before your streak breaks" },
    { key: "milestone_alerts", label: "Milestone alerts", description: "When you hit rep targets" },
    { key: "friend_activity", label: "Friend activity", description: "When friends pass you on the leaderboard" },
    { key: "challenge_updates", label: "Challenge updates", description: "Daily and monthly challenge progress" },
  ];

  return (
    <div className="space-y-4">
      <div className="drop-card divide-y divide-gray-100">
        {toggles.map((t) => {
          const value = prefs[t.key] as boolean;
          return (
            <div key={String(t.key)} className="flex items-center justify-between p-4">
              <div className="flex-1 pr-4">
                <p className="text-sm font-bold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-400">{t.description}</p>
              </div>
              <button
                onClick={() => update({ [t.key]: !value } as Partial<NotificationPreferences>)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  value ? "bg-[#e8450a]" : "bg-gray-200"
                }`}
                aria-pressed={value}
                aria-label={`Toggle ${t.label}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    value ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="drop-card p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Quiet hours
        </p>
        <p className="text-xs text-gray-400 mb-3">
          We won&apos;t send notifications during these hours.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">From</label>
            <select
              value={prefs.quiet_hours_start}
              onChange={(e) => update({ quiet_hours_start: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-900"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">To</label>
            <select
              value={prefs.quiet_hours_end}
              onChange={(e) => update({ quiet_hours_end: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-900"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="drop-card p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Test notification
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Send yourself a push to confirm everything&apos;s wired up.
        </p>
        <button
          onClick={sendTest}
          disabled={testing}
          className="w-full py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold disabled:opacity-50"
        >
          {testing ? "Sending…" : "Send test notification"}
        </button>
        {testStatus && (
          <p className="text-xs text-gray-500 text-center mt-2">{testStatus}</p>
        )}
      </div>

      {saving && <p className="text-xs text-gray-400 text-center">Saving…</p>}
    </div>
  );
}
