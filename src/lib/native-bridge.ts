import { debugLog } from "@/lib/debug-log";

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, unknown>).Capacitor;
}

export async function initNativeBridge(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    debugLog("Native: status bar configured");
  } catch {
    // Plugin not available
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
    debugLog("Native: splash screen hidden");
  } catch {
    // Plugin not available
  }
}

export async function nativeHaptic(style: "light" | "medium" | "heavy"): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    // Fallback to web haptics handled elsewhere
  }
}
