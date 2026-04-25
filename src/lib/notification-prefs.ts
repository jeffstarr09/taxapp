import { createClient } from "@/lib/supabase";
import { debugError, debugLog } from "@/lib/debug-log";
import type { MotivationTier } from "@/lib/motivation";

export interface NotificationPreferences {
  user_id: string;
  streak_reminders: boolean;
  milestone_alerts: boolean;
  friend_activity: boolean;
  challenge_updates: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone_offset_minutes: number | null;
}

export const DEFAULT_PREFS: Omit<NotificationPreferences, "user_id"> = {
  streak_reminders: true,
  milestone_alerts: true,
  friend_activity: true,
  challenge_updates: true,
  quiet_hours_start: 22,
  quiet_hours_end: 8,
  timezone_offset_minutes: null,
};

function localOffsetMinutes(): number {
  // JS getTimezoneOffset returns minutes WEST of UTC (positive for negative UTC offset).
  // We want minutes EAST of UTC, so flip the sign.
  return -new Date().getTimezoneOffset();
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    debugError("notif-prefs: load failed", { code: error.code, message: error.message });
    return null;
  }
  if (!data) {
    // Insert default row if missing (the trigger should handle this, but be defensive)
    const insert: NotificationPreferences = {
      user_id: userId,
      ...DEFAULT_PREFS,
      timezone_offset_minutes: localOffsetMinutes(),
    };
    const { data: created, error: insertErr } = await supabase
      .from("notification_preferences")
      .insert(insert)
      .select()
      .single();
    if (insertErr) {
      debugError("notif-prefs: insert failed", { code: insertErr.code, message: insertErr.message });
      return null;
    }
    return created as NotificationPreferences;
  }

  // Backfill timezone offset on first read if missing
  if (data.timezone_offset_minutes === null) {
    const offset = localOffsetMinutes();
    await supabase
      .from("notification_preferences")
      .update({ timezone_offset_minutes: offset })
      .eq("user_id", userId);
    data.timezone_offset_minutes = offset;
  }

  return data as NotificationPreferences;
}

export async function updateNotificationPreferences(
  userId: string,
  patch: Partial<Omit<NotificationPreferences, "user_id">>
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notification_preferences")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    debugError("notif-prefs: update failed", { code: error.code, message: error.message });
    return false;
  }
  debugLog("notif-prefs: updated", patch);
  return true;
}

// Mirror motivation tier to profile so server-side cron can pick the right copy.
export async function syncMotivationTierToProfile(
  userId: string,
  tier: MotivationTier
): Promise<void> {
  try {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ motivation_tier: tier })
      .eq("id", userId);
  } catch (err) {
    debugError("notif-prefs: tier sync failed", { error: err instanceof Error ? err.message : String(err) });
  }
}
