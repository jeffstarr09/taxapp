const REFERRAL_KEY = "drop_referral";
const MULTIPLIER_KEY = "drop_calorie_multiplier";

export interface ReferralInfo {
  code: string;
  referredBy: string | null;
  referralCount: number;
}

export function getReferralCode(userId: string): string {
  return userId.substring(0, 8);
}

export function getReferralUrl(userId: string): string {
  const code = getReferralCode(userId);
  // Always point recipients at the production website, not the in-app
  // origin. Inside the iOS app, window.location.origin is
  // "capacitor://localhost" which is meaningless to anyone the link is
  // shared with.
  return `https://dropfit.app/?ref=${code}`;
}

export function storeReferralCode(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    localStorage.setItem(REFERRAL_KEY, ref);
  }
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFERRAL_KEY);
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFERRAL_KEY);
}

export function activateCalorieMultiplier(): void {
  if (typeof window === "undefined") return;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  localStorage.setItem(MULTIPLIER_KEY, expires);
}

export function getCalorieMultiplier(): number {
  if (typeof window === "undefined") return 1;
  const expires = localStorage.getItem(MULTIPLIER_KEY);
  if (!expires) return 1;
  if (new Date(expires) < new Date()) {
    localStorage.removeItem(MULTIPLIER_KEY);
    return 1;
  }
  return 1.5;
}

export function getMultiplierExpiry(): Date | null {
  if (typeof window === "undefined") return null;
  const expires = localStorage.getItem(MULTIPLIER_KEY);
  if (!expires) return null;
  const date = new Date(expires);
  if (date < new Date()) {
    localStorage.removeItem(MULTIPLIER_KEY);
    return null;
  }
  return date;
}
