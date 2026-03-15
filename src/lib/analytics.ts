"use client";

import { createClient } from "@/lib/supabase";

// Generate a unique session ID per browser tab/visit
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return sessionId;
}

// Track session start time for duration calculation
let sessionStartTime: number | null = null;

function getSessionStartTime(): number {
  if (!sessionStartTime) {
    sessionStartTime = Date.now();
  }
  return sessionStartTime;
}

/**
 * Track an analytics event. Fire-and-forget — never blocks the UI.
 */
export function trackEvent(
  eventName: string,
  eventData: Record<string, unknown> = {},
  page?: string
): void {
  if (typeof window === "undefined") return;

  const supabase = createClient();

  // Get current user ID if logged in (don't await)
  supabase.auth.getUser().then(({ data }) => {
    const userId = data?.user?.id ?? null;

    supabase
      .from("analytics_events")
      .insert({
        user_id: userId,
        event_name: eventName,
        event_data: {
          ...eventData,
          session_duration_ms: Date.now() - getSessionStartTime(),
          user_agent: navigator.userAgent,
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          referrer: document.referrer || null,
        },
        page: page ?? window.location.pathname,
        session_id: getSessionId(),
      })
      .then(() => {
        // fire and forget
      });
  });
}

/**
 * Track a page view. Call this on route changes.
 */
export function trackPageView(page?: string): void {
  trackEvent("page_view", {}, page);
}

/**
 * Track workout-specific events with structured data.
 */
export function trackWorkoutEvent(
  action: "started" | "completed" | "abandoned",
  data: {
    repCount?: number;
    duration?: number;
    formScore?: number;
  } = {}
): void {
  trackEvent(`workout_${action}`, data, "/workout");
}

/**
 * Track session end (called on page unload).
 */
export function trackSessionEnd(): void {
  if (typeof window === "undefined") return;

  const duration = Date.now() - getSessionStartTime();

  // Use sendBeacon for reliability on page unload
  const supabase = createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  // sendBeacon is more reliable than fetch on unload
  const payload = JSON.stringify({
    user_id: null, // can't async-get user on unload
    event_name: "session_end",
    event_data: {
      total_duration_ms: duration,
      pages_visited: performance.getEntriesByType?.("navigation")?.length ?? 1,
    },
    page: window.location.pathname,
    session_id: getSessionId(),
  });

  navigator.sendBeacon?.(
    `${supabaseUrl}/rest/v1/analytics_events`,
    new Blob([payload], { type: "application/json" })
  );
}
