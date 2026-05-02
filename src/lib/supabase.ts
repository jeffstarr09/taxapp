import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { isNative } from "@/lib/native";

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  // On Capacitor native (iOS), the app loads from a custom scheme
  // (capacitor://localhost) where WKWebView does not reliably persist cookies
  // across launches/backgrounding. Use supabase-js with localStorage instead,
  // which WKWebView persists durably even on custom schemes. The web build
  // keeps the @supabase/ssr cookie client for Next.js SSR coordination.
  if (isNative()) {
    client = createSupabaseClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } else {
    client = createBrowserClient(url, key) as unknown as SupabaseClient;
  }
  return client;
}
