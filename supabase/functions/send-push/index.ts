// Supabase Edge Function: send-push
// Invocation:
//   POST https://<project>.supabase.co/functions/v1/send-push
//   Headers: { authorization: 'Bearer <service-role-or-anon>', 'content-type': 'application/json' }
//   Body: { user_id, category, title, body, data?, ignore_quiet_hours? }
//
// Behavior:
//   - Looks up active push tokens for the user
//   - Checks notification_preferences for the category and quiet hours
//   - Signs an APNs JWT using APNS_PRIVATE_KEY and ships the alert
//   - Logs the result in notification_log
//
// Required env vars:
//   APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY, APNS_USE_SANDBOX
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (provided by platform)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadApnsConfigFromEnv, sendApnsPush } from "../_shared/apns.ts";

interface RequestBody {
  user_id: string;
  category: "streak_reminder" | "milestone" | "friend_activity" | "challenge" | "comeback";
  title: string;
  body: string;
  data?: Record<string, unknown>;
  ignore_quiet_hours?: boolean;
}

interface PushToken {
  token: string;
  platform: string;
}

interface NotificationPreferences {
  streak_reminders: boolean;
  milestone_alerts: boolean;
  friend_activity: boolean;
  challenge_updates: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone_offset_minutes: number | null;
}

const CATEGORY_TO_PREF: Record<string, keyof NotificationPreferences> = {
  streak_reminder: "streak_reminders",
  comeback: "streak_reminders",
  milestone: "milestone_alerts",
  friend_activity: "friend_activity",
  challenge: "challenge_updates",
};

function isInQuietHours(prefs: NotificationPreferences): boolean {
  const offset = prefs.timezone_offset_minutes ?? 0;
  const nowUtc = new Date();
  const localMs = nowUtc.getTime() + offset * 60 * 1000;
  const localHour = new Date(localMs).getUTCHours();

  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;

  if (start === end) return false;
  if (start < end) {
    return localHour >= start && localHour < end;
  }
  // Wraps midnight, e.g. 22 → 8
  return localHour >= start || localHour < end;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: RequestBody;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { user_id, category, title, body, data, ignore_quiet_hours } = payload;
  if (!user_id || !category || !title || !body) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: user_id, category, title, body" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Check preferences
  const prefKey = CATEGORY_TO_PREF[category];
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("streak_reminders, milestone_alerts, friend_activity, challenge_updates, quiet_hours_start, quiet_hours_end, timezone_offset_minutes")
    .eq("user_id", user_id)
    .single<NotificationPreferences>();

  if (prefs && prefKey && prefs[prefKey] === false) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "user opted out of category" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  if (prefs && !ignore_quiet_hours && isInQuietHours(prefs)) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "quiet hours" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // Look up active tokens
  const { data: tokens, error: tokenErr } = await supabase
    .from("push_tokens")
    .select("token, platform")
    .eq("user_id", user_id)
    .eq("active", true)
    .returns<PushToken[]>();

  if (tokenErr) {
    return new Response(JSON.stringify({ error: tokenErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (!tokens || tokens.length === 0) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "no active tokens" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  let apnsConfig;
  try {
    apnsConfig = loadApnsConfigFromEnv();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const results: Array<{ token: string; status: number; reason: string | null }> = [];

  for (const t of tokens) {
    if (t.platform !== "ios") continue; // Android (FCM) not implemented yet

    const result = await sendApnsPush(apnsConfig, t.token, {
      title,
      body,
      data,
      threadId: category,
    });

    results.push({
      token: t.token.substring(0, 12) + "...",
      status: result.status,
      reason: result.reason,
    });

    await supabase.from("notification_log").insert({
      user_id,
      category,
      title,
      body,
      data: data ?? {},
      apns_response_status: result.status,
      apns_response_body: result.body || null,
      delivered: result.ok,
    });

    // Deactivate token if Apple says it's invalid
    if (result.status === 410 || result.reason === "BadDeviceToken" || result.reason === "Unregistered") {
      await supabase
        .from("push_tokens")
        .update({ active: false })
        .eq("user_id", user_id)
        .eq("token", t.token);
    }
  }

  return new Response(JSON.stringify({ delivered: true, results }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
