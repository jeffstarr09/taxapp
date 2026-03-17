"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView, trackSessionEnd, trackEvent } from "@/lib/analytics";

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Track page views on route change
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  // Track session lifecycle
  useEffect(() => {
    trackEvent("session_start");

    const handleUnload = () => trackSessionEnd();
    window.addEventListener("beforeunload", handleUnload);

    // Track visibility changes (app backgrounded on mobile)
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        trackEvent("app_backgrounded");
      } else {
        trackEvent("app_foregrounded");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <>{children}</>;
}
