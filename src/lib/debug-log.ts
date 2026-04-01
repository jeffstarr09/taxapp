/**
 * Simple debug logger that writes to localStorage.
 * Viewable on the admin dashboard under "Debug Log".
 */

interface DebugEntry {
  time: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
}

const MAX_ENTRIES = 100;
const STORAGE_KEY = "drop_debug_log";

function getLog(): DebugEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLog(entry: DebugEntry) {
  const log = getLog();
  log.unshift(entry); // newest first
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // localStorage full — clear and retry
    localStorage.removeItem(STORAGE_KEY);
  }
  // Also mirror to console
  const method = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "log";
  console[method](`[DROP] ${entry.message}`, entry.data ?? "");
}

export function debugLog(message: string, data?: unknown) {
  writeLog({ time: new Date().toISOString(), level: "info", message, data });
}

export function debugWarn(message: string, data?: unknown) {
  writeLog({ time: new Date().toISOString(), level: "warn", message, data });
}

export function debugError(message: string, data?: unknown) {
  writeLog({ time: new Date().toISOString(), level: "error", message, data });
}

export function getDebugLog(): DebugEntry[] {
  return getLog();
}

export function clearDebugLog() {
  localStorage.removeItem(STORAGE_KEY);
}
