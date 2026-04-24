import { createClient } from "@/lib/supabase";
import { debugLog, debugError } from "@/lib/debug-log";

interface PushNotificationPlugin {
  requestPermissions(): Promise<{ receive: string }>;
  register(): Promise<void>;
  addListener(event: string, callback: (data: unknown) => void): Promise<{ remove: () => void }>;
}

let capacitorPush: PushNotificationPlugin | null = null;

async function getCapacitorPush(): Promise<PushNotificationPlugin | null> {
  if (capacitorPush) return capacitorPush;
  try {
    const mod = await import("@capacitor/push-notifications");
    capacitorPush = mod.PushNotifications;
    return capacitorPush;
  } catch {
    return null;
  }
}

function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, unknown>).Capacitor;
}

export async function registerPushNotifications(userId: string): Promise<boolean> {
  if (!isNativeApp()) {
    debugLog("Push: not a native app, skipping registration");
    return false;
  }

  const push = await getCapacitorPush();
  if (!push) {
    debugLog("Push: plugin not available");
    return false;
  }

  try {
    const permission = await push.requestPermissions();
    if (permission.receive !== "granted") {
      debugLog("Push: permission denied", { receive: permission.receive });
      return false;
    }

    await push.register();

    push.addListener("registration", async (data: unknown) => {
      const token = (data as { value: string }).value;
      debugLog("Push: registered", { tokenPrefix: token.substring(0, 20) + "..." });
      await saveToken(userId, token);
    });

    push.addListener("registrationError", (error: unknown) => {
      debugError("Push: registration failed", { error });
    });

    push.addListener("pushNotificationReceived", (notification: unknown) => {
      debugLog("Push: notification received in foreground", { notification });
    });

    push.addListener("pushNotificationActionPerformed", (action: unknown) => {
      debugLog("Push: notification tapped", { action });
      const data = (action as { notification?: { data?: { url?: string } } })?.notification?.data;
      if (data?.url) {
        window.location.href = data.url;
      }
    });

    return true;
  } catch (err) {
    debugError("Push: error during registration", { error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

async function saveToken(userId: string, token: string): Promise<void> {
  try {
    const supabase = createClient();

    const platform = "ios";
    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        token,
        platform,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" }
    );

    if (error) {
      debugError("Push: token save failed", { code: error.code, message: error.message });
    } else {
      debugLog("Push: token saved to Supabase");
    }
  } catch (err) {
    debugError("Push: token save error", { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase
      .from("push_tokens")
      .update({ active: false })
      .eq("user_id", userId);
    debugLog("Push: tokens deactivated");
  } catch (err) {
    debugError("Push: unregister error", { error: err instanceof Error ? err.message : String(err) });
  }
}
