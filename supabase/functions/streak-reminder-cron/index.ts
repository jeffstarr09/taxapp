// Supabase Edge Function: streak-reminder-cron
// Triggered by Supabase Cron (or any HTTP scheduler) on a regular cadence.
// Recommended: every hour. The function gates on the user's local time,
// so it only sends reminders when the user is awake and the streak is at risk.
//
// What it does:
//   1. For each user with notifications enabled, computes their local hour
//      from notification_preferences.timezone_offset_minutes
//   2. If local hour is in the "evening reminder window" (default 18-21),
//      checks whether the user has worked out today
//   3. If they have a streak (>0) and haven't worked out today, sends a
//      streak-at-risk push (throttled to once per 20 hours)
//   4. If they have no current streak but worked out within the last 14 days,
//      sends a "come back" reminder if it's been 1, 3, or 7 days inactive
//
// Required env vars (in addition to APNs vars):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (provided by platform)
//   REMINDER_WINDOW_START (optional, default 18 = 6pm)
//   REMINDER_WINDOW_END (optional, default 21 = 9pm)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadApnsConfigFromEnv, sendApnsPush } from "../_shared/apns.ts";
import {
  comeBackMessage,
  streakAtRiskMessage,
  type MotivationTier,
} from "../_shared/messages.ts";

interface PrefsRow {
  user_id: string;
  streak_reminders: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone_offset_minutes: number | null;
  last_streak_reminder_at: string | null;
  last_comeback_reminder_at: string | null;
  motivation_tier: MotivationTier | null;
}

interface WorkoutRow {
  user_id: string;
  date: string;
}

interface PushTokenRow {
  user_id: string;
  token: string;
  platform: string;
}

function localHour(offsetMinutes: number | null): number {
  const offset = offsetMinutes ?? 0;
  const ms = Date.now() + offset * 60 * 1000;
  return new Date(ms).getUTCHours();
}

function localDateString(offsetMinutes: number | null): string {
  const offset = offsetMinutes ?? 0;
  const ms = Date.now() + offset * 60 * 1000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isInQuietHours(start: number, end: number, hour: number): boolean {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function computeStreak(workoutDateStrings: Set<string>, todayLocal: string): number {
  if (!workoutDateStrings.has(todayLocal)) {
    // Streak survives if user worked out yesterday
    const yesterday = new Date(todayLocal);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const ystr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, "0")}-${String(yesterday.getUTCDate()).padStart(2, "0")}`;
    if (!workoutDateStrings.has(ystr)) return 0;
  }

  let streak = 0;
  const day = new Date(todayLocal);
  if (!workoutDateStrings.has(todayLocal)) {
    day.setUTCDate(day.getUTCDate() - 1);
  }
  while (true) {
    const dstr = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
    if (!workoutDateStrings.has(dstr)) break;
    streak++;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return streak;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const windowStart = parseInt(Deno.env.get("REMINDER_WINDOW_START") ?? "18", 10);
  const windowEnd = parseInt(Deno.env.get("REMINDER_WINDOW_END") ?? "21", 10);

  let apnsConfig;
  try {
    apnsConfig = loadApnsConfigFromEnv();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  // Fetch preferences for users who opted in
  const { data: prefsList, error: prefsErr } = await supabase
    .from("notification_preferences")
    .select("user_id, streak_reminders, quiet_hours_start, quiet_hours_end, timezone_offset_minutes, last_streak_reminder_at, last_comeback_reminder_at")
    .eq("streak_reminders", true)
    .returns<Omit<PrefsRow, "motivation_tier">[]>();

  if (prefsErr) {
    return new Response(JSON.stringify({ error: prefsErr.message }), { status: 500 });
  }
  if (!prefsList || prefsList.length === 0) {
    return new Response(JSON.stringify({ checked: 0, sent: 0 }), { status: 200 });
  }

  // Filter to users in their evening window and not in quiet hours
  const eligible = prefsList.filter((p) => {
    const hour = localHour(p.timezone_offset_minutes);
    if (isInQuietHours(p.quiet_hours_start, p.quiet_hours_end, hour)) return false;
    return hour >= windowStart && hour < windowEnd;
  });

  if (eligible.length === 0) {
    return new Response(JSON.stringify({ checked: prefsList.length, sent: 0, eligible: 0 }), { status: 200 });
  }

  const userIds = eligible.map((p) => p.user_id);

  // Pull recent workouts for these users (last 21 days is enough for streaks + comebacks)
  const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const { data: workouts } = await supabase
    .from("workouts")
    .select("user_id, date")
    .in("user_id", userIds)
    .gte("date", cutoff)
    .returns<WorkoutRow[]>();

  // Group workouts by user → set of local-date strings per user
  const workoutDatesByUser: Record<string, Set<string>> = {};
  const lastWorkoutByUser: Record<string, Date> = {};
  for (const w of workouts ?? []) {
    const d = new Date(w.date);
    workoutDatesByUser[w.user_id] ??= new Set();
    // Use UTC date here; close enough for streak grouping. Locale-correct date is
    // computed per user via offset below.
    const offset = eligible.find((p) => p.user_id === w.user_id)?.timezone_offset_minutes ?? 0;
    const local = new Date(d.getTime() + offset * 60 * 1000);
    const dstr = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`;
    workoutDatesByUser[w.user_id].add(dstr);

    const prev = lastWorkoutByUser[w.user_id];
    if (!prev || d > prev) lastWorkoutByUser[w.user_id] = d;
  }

  // Pull tokens for all eligible users
  const { data: tokenRows } = await supabase
    .from("push_tokens")
    .select("user_id, token, platform")
    .in("user_id", userIds)
    .eq("active", true)
    .eq("platform", "ios")
    .returns<PushTokenRow[]>();

  const tokensByUser: Record<string, string[]> = {};
  for (const t of tokenRows ?? []) {
    tokensByUser[t.user_id] ??= [];
    tokensByUser[t.user_id].push(t.token);
  }

  // Pull motivation tier from a putative profile column. If not present, default
  // to 'motivational'. Client stores tier in localStorage today; once persisted
  // server-side this will pick it up automatically.
  const { data: tierRows } = await supabase
    .from("profiles")
    .select("id, motivation_tier")
    .in("id", userIds)
    .returns<{ id: string; motivation_tier: MotivationTier | null }[]>();
  const tierByUser: Record<string, MotivationTier> = {};
  for (const r of tierRows ?? []) {
    tierByUser[r.id] = r.motivation_tier ?? "motivational";
  }

  let sent = 0;
  let skipped = 0;
  const STREAK_THROTTLE_HOURS = 20;
  const COMEBACK_THROTTLE_HOURS = 23;

  for (const p of eligible) {
    const tokens = tokensByUser[p.user_id];
    if (!tokens || tokens.length === 0) { skipped++; continue; }

    const dates = workoutDatesByUser[p.user_id] ?? new Set<string>();
    const todayLocal = localDateString(p.timezone_offset_minutes);
    const workedOutToday = dates.has(todayLocal);
    if (workedOutToday) { skipped++; continue; }

    const streak = computeStreak(dates, todayLocal);
    const tier = tierByUser[p.user_id] ?? "motivational";

    let title: string;
    let body: string;
    let category: "streak_reminder" | "comeback";

    if (streak > 0) {
      // Streak at risk
      const last = p.last_streak_reminder_at ? new Date(p.last_streak_reminder_at) : null;
      if (last && (Date.now() - last.getTime()) < STREAK_THROTTLE_HOURS * 60 * 60 * 1000) {
        skipped++; continue;
      }
      const m = streakAtRiskMessage(tier, streak);
      title = m.title; body = m.body; category = "streak_reminder";
    } else {
      // Comeback nudge — only at exactly 1/3/7 day boundaries
      const last = lastWorkoutByUser[p.user_id];
      if (!last) { skipped++; continue; }
      const daysOff = daysBetween(new Date(), last);
      if (daysOff !== 1 && daysOff !== 3 && daysOff !== 7) { skipped++; continue; }

      const lastReminder = p.last_comeback_reminder_at ? new Date(p.last_comeback_reminder_at) : null;
      if (lastReminder && (Date.now() - lastReminder.getTime()) < COMEBACK_THROTTLE_HOURS * 60 * 60 * 1000) {
        skipped++; continue;
      }
      const m = comeBackMessage(tier, daysOff);
      title = m.title; body = m.body; category = "comeback";
    }

    let delivered = false;
    for (const token of tokens) {
      const result = await sendApnsPush(apnsConfig, token, {
        title,
        body,
        threadId: category,
        data: { url: "/workout" },
      });

      await supabase.from("notification_log").insert({
        user_id: p.user_id,
        category,
        title,
        body,
        data: { url: "/workout" },
        apns_response_status: result.status,
        apns_response_body: result.body || null,
        delivered: result.ok,
      });

      if (result.ok) delivered = true;

      if (result.status === 410 || result.reason === "BadDeviceToken" || result.reason === "Unregistered") {
        await supabase
          .from("push_tokens")
          .update({ active: false })
          .eq("user_id", p.user_id)
          .eq("token", token);
      }
    }

    if (delivered) {
      const updateField = category === "streak_reminder"
        ? { last_streak_reminder_at: new Date().toISOString() }
        : { last_comeback_reminder_at: new Date().toISOString() };
      await supabase
        .from("notification_preferences")
        .update(updateField)
        .eq("user_id", p.user_id);
      sent++;
    }
  }

  return new Response(
    JSON.stringify({ checked: prefsList.length, eligible: eligible.length, sent, skipped }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
});
