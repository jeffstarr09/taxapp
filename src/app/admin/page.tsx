"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

// ── Types ──────────────────────────────────────────────────────

interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_name: string;
  event_data: Record<string, unknown>;
  page: string;
  session_id: string;
  created_at: string;
}

interface DailyMetric {
  date: string;
  count: number;
}

interface MetricCard {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

// ── Admin emails whitelist ─────────────────────────────────────
// Add your email here to access the dashboard
const ADMIN_EMAILS = ["admin@drop.app"];

// ── Helpers ────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function groupByDate(events: AnalyticsEvent[]): DailyMetric[] {
  const map = new Map<string, number>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function uniqueCount(events: AnalyticsEvent[], key: "user_id" | "session_id"): number {
  return new Set(events.map((e) => e[key]).filter(Boolean)).size;
}

// ── Simple bar chart ───────────────────────────────────────────

function BarChart({ data, label }: { data: DailyMetric[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end gap-1 h-32">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-neutral-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
              {d.count} — {formatDate(d.date)}
            </div>
            <div
              className="w-full bg-drop-600 rounded-t transition-all hover:bg-drop-500"
              style={{
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count > 0 ? 4 : 0,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-neutral-600 text-[10px]">{data.length > 0 ? formatDate(data[0].date) : ""}</span>
        <span className="text-neutral-600 text-[10px]">{data.length > 0 ? formatDate(data[data.length - 1].date) : ""}</span>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; username: string; display_name: string; created_at: string }[]>([]);
  const [workouts, setWorkouts] = useState<{ id: string; user_id: string; count: number; duration: number; average_form_score: number; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30); // days
  const [adminKey, setAdminKey] = useState("");
  const [authorized, setAuthorized] = useState(false);

  // Simple auth: check email or allow with a key stored in localStorage
  useEffect(() => {
    if (authLoading) return;
    const storedKey = localStorage.getItem("drop_admin_key");
    if (storedKey) {
      setAdminKey(storedKey);
      setAuthorized(true);
    } else if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      setAuthorized(true);
    }
  }, [user, authLoading]);

  const handleKeySubmit = () => {
    if (adminKey === "drop-admin-2024") {
      localStorage.setItem("drop_admin_key", adminKey);
      setAuthorized(true);
    }
  };

  const fetchData = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    const supabase = createClient();
    const since = daysAgo(range);

    const [eventsRes, profilesRes, workoutsRes] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000),
      supabase.from("profiles").select("id, username, display_name, created_at"),
      supabase
        .from("workouts")
        .select("id, user_id, count, duration, average_form_score, date")
        .gte("date", since)
        .order("date", { ascending: false }),
    ]);

    setEvents(eventsRes.data ?? []);
    setProfiles(profilesRes.data ?? []);
    setWorkouts(workoutsRes.data ?? []);
    setLoading(false);
  }, [authorized, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Computed metrics ──

  const pageViews = events.filter((e) => e.event_name === "page_view");
  const sessions = events.filter((e) => e.event_name === "session_start");
  const workoutStarts = events.filter((e) => e.event_name === "workout_started");
  const workoutCompletes = events.filter((e) => e.event_name === "workout_completed");
  const workoutSaves = events.filter((e) => e.event_name === "workout_saved");
  const signups = events.filter((e) => e.event_name === "user_signup");
  const logins = events.filter((e) => e.event_name === "user_login");
  const shares = events.filter((e) => e.event_name === "workout_shared");
  const friendsAdded = events.filter((e) => e.event_name === "friend_added");

  const uniqueUsers = uniqueCount(events, "user_id");
  const uniqueSessions = uniqueCount(events, "session_id");

  // Session duration from session_end events
  const sessionEnds = events.filter((e) => e.event_name === "session_end");
  const avgSessionDuration =
    sessionEnds.length > 0
      ? Math.round(
          sessionEnds.reduce((s, e) => s + ((e.event_data.total_duration_ms as number) ?? 0), 0) /
            sessionEnds.length /
            1000
        )
      : 0;

  // Workout metrics from workouts table
  const totalReps = workouts.reduce((s, w) => s + w.count, 0);
  const avgRepsPerWorkout = workouts.length > 0 ? Math.round(totalReps / workouts.length) : 0;
  const avgFormScore =
    workouts.length > 0
      ? Math.round(workouts.reduce((s, w) => s + w.average_form_score, 0) / workouts.length)
      : 0;
  const avgWorkoutDuration =
    workouts.length > 0
      ? Math.round(workouts.reduce((s, w) => s + w.duration, 0) / workouts.length)
      : 0;

  // Conversion funnel
  const conversionRate =
    workoutStarts.length > 0
      ? Math.round((workoutSaves.length / workoutStarts.length) * 100)
      : 0;

  // Page popularity
  const pageHits = new Map<string, number>();
  for (const pv of pageViews) {
    pageHits.set(pv.page, (pageHits.get(pv.page) ?? 0) + 1);
  }
  const topPages = Array.from(pageHits.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Event frequency
  const eventCounts = new Map<string, number>();
  for (const e of events) {
    eventCounts.set(e.event_name, (eventCounts.get(e.event_name) ?? 0) + 1);
  }
  const topEvents = Array.from(eventCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  // Most active users
  const userWorkoutCounts = new Map<string, number>();
  for (const w of workouts) {
    userWorkoutCounts.set(w.user_id, (userWorkoutCounts.get(w.user_id) ?? 0) + 1);
  }
  const topUserIds = Array.from(userWorkoutCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topUsers = topUserIds.map(([id, count]) => {
    const p = profiles.find((p) => p.id === id);
    return { username: p?.display_name ?? id.slice(0, 8), count };
  });

  // Device breakdown from screen width
  const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
  for (const e of sessions) {
    const w = (e.event_data.screen_width as number) ?? 0;
    if (w < 768) deviceCounts.mobile++;
    else if (w < 1024) deviceCounts.tablet++;
    else deviceCounts.desktop++;
  }

  // ── Unauthorized view ──

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <h1 className="text-2xl font-black text-white mb-2">Admin Dashboard</h1>
        <p className="text-neutral-500 text-sm mb-6">Enter the admin key to access analytics.</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
            placeholder="Admin key..."
            className="flex-1 px-3 py-2 bg-neutral-800 text-white rounded-lg border border-white/5 focus:border-drop-600 focus:outline-none placeholder-neutral-600 text-sm"
          />
          <button
            onClick={handleKeySubmit}
            className="px-4 py-2 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-semibold text-sm"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  // ── Metric cards ──

  const metrics: MetricCard[] = [
    { label: "Total Users", value: profiles.length, sub: `${signups.length} new (${range}d)` },
    { label: "Unique Active Users", value: uniqueUsers, sub: `${range}-day window` },
    { label: "Total Sessions", value: uniqueSessions },
    { label: "Avg Session Duration", value: avgSessionDuration > 0 ? `${Math.floor(avgSessionDuration / 60)}m ${avgSessionDuration % 60}s` : "—" },
    { label: "Page Views", value: pageViews.length },
    { label: "Workouts Started", value: workoutStarts.length },
    { label: "Workouts Saved", value: workoutSaves.length, sub: `${conversionRate}% conversion` },
    { label: "Total Reps Tracked", value: totalReps.toLocaleString() },
    { label: "Avg Reps / Workout", value: avgRepsPerWorkout },
    { label: "Avg Form Score", value: `${avgFormScore}%` },
    { label: "Avg Workout Duration", value: avgWorkoutDuration > 0 ? `${Math.floor(avgWorkoutDuration / 60)}m ${avgWorkoutDuration % 60}s` : "—" },
    { label: "Shares", value: shares.length },
    { label: "Friends Added", value: friendsAdded.length },
    { label: "Logins", value: logins.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            {loading ? "Loading..." : `${events.length} events · ${profiles.length} users · Last ${range} days`}
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                range === d
                  ? "bg-drop-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-6 h-6 border-2 border-drop-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Metric cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 mb-8">
            {metrics.map((m) => (
              <div key={m.label} className="drop-card rounded-xl p-3">
                <p className="text-neutral-500 text-[10px] uppercase tracking-widest mb-1">{m.label}</p>
                <p className="text-xl font-bold text-white">{m.value}</p>
                {m.sub && <p className="text-neutral-600 text-[10px] mt-0.5">{m.sub}</p>}
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="drop-card rounded-xl p-4">
              <BarChart data={groupByDate(pageViews)} label="Page Views / Day" />
            </div>
            <div className="drop-card rounded-xl p-4">
              <BarChart data={groupByDate(sessions)} label="Sessions / Day" />
            </div>
            <div className="drop-card rounded-xl p-4">
              <BarChart data={groupByDate(workoutStarts)} label="Workouts Started / Day" />
            </div>
            <div className="drop-card rounded-xl p-4">
              <BarChart data={groupByDate(signups)} label="Signups / Day" />
            </div>
          </div>

          {/* Tables row */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Top pages */}
            <div className="drop-card rounded-xl p-4">
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Top Pages</p>
              <div className="space-y-2">
                {topPages.map(([page, count]) => (
                  <div key={page} className="flex items-center justify-between">
                    <span className="text-white text-sm font-mono truncate">{page}</span>
                    <span className="text-neutral-400 text-sm font-bold ml-2">{count}</span>
                  </div>
                ))}
                {topPages.length === 0 && <p className="text-neutral-600 text-xs">No data yet</p>}
              </div>
            </div>

            {/* Event breakdown */}
            <div className="drop-card rounded-xl p-4">
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Event Breakdown</p>
              <div className="space-y-2">
                {topEvents.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-white text-sm truncate">{name.replace(/_/g, " ")}</span>
                    <span className="text-neutral-400 text-sm font-bold ml-2">{count}</span>
                  </div>
                ))}
                {topEvents.length === 0 && <p className="text-neutral-600 text-xs">No data yet</p>}
              </div>
            </div>

            {/* Most active users */}
            <div className="drop-card rounded-xl p-4">
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Most Active Users</p>
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-white text-sm truncate">{u.username}</span>
                    <span className="text-neutral-400 text-sm font-bold ml-2">{u.count} workouts</span>
                  </div>
                ))}
                {topUsers.length === 0 && <p className="text-neutral-600 text-xs">No data yet</p>}
              </div>
            </div>
          </div>

          {/* Device breakdown + Funnel */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Device breakdown */}
            <div className="drop-card rounded-xl p-4">
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Device Breakdown</p>
              <div className="flex gap-4">
                {(["mobile", "tablet", "desktop"] as const).map((device) => {
                  const count = deviceCounts[device];
                  const total = deviceCounts.mobile + deviceCounts.tablet + deviceCounts.desktop;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={device} className="flex-1 text-center">
                      <p className="text-3xl font-bold text-white">{pct}%</p>
                      <p className="text-neutral-500 text-xs capitalize mt-1">{device}</p>
                      <p className="text-neutral-600 text-[10px]">{count} sessions</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="drop-card rounded-xl p-4">
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Workout Funnel</p>
              <div className="space-y-2">
                {[
                  { label: "Visited workout page", value: pageViews.filter((e) => e.page === "/workout").length },
                  { label: "Started workout", value: workoutStarts.length },
                  { label: "Completed workout", value: workoutCompletes.length },
                  { label: "Saved workout", value: workoutSaves.length },
                  { label: "Shared result", value: shares.length },
                ].map((step, i) => {
                  const maxVal = Math.max(
                    pageViews.filter((e) => e.page === "/workout").length,
                    1
                  );
                  const pct = Math.round((step.value / maxVal) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">{step.label}</span>
                        <span className="text-white font-bold">{step.value}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-drop-600 to-drop-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent events stream */}
          <div className="drop-card rounded-xl p-4">
            <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Recent Events (last 50)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 text-xs uppercase tracking-wider border-b border-white/5">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2 pr-4">Page</th>
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 50).map((e) => {
                    const p = profiles.find((p) => p.id === e.user_id);
                    return (
                      <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2 pr-4 text-neutral-500 text-xs whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2 pr-4 text-white font-medium">{e.event_name.replace(/_/g, " ")}</td>
                        <td className="py-2 pr-4 text-neutral-400 font-mono text-xs">{e.page}</td>
                        <td className="py-2 pr-4 text-neutral-400 text-xs">{p?.display_name ?? (e.user_id ? e.user_id.slice(0, 8) : "anon")}</td>
                        <td className="py-2 text-neutral-600 text-xs max-w-[200px] truncate">
                          {Object.keys(e.event_data).length > 0 &&
                            !["user_agent", "screen_width", "screen_height", "referrer", "session_duration_ms"].every(
                              (k) => k in e.event_data
                            ) &&
                            JSON.stringify(
                              Object.fromEntries(
                                Object.entries(e.event_data).filter(
                                  ([k]) => !["user_agent", "screen_width", "screen_height", "referrer", "session_duration_ms"].includes(k)
                                )
                              )
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {events.length === 0 && (
                <p className="text-neutral-600 text-xs text-center py-8">No events recorded yet. Use the app to generate data.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
