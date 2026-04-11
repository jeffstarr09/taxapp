import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * OAuth callback route handler.
 *
 * With @supabase/ssr's default PKCE flow, the client initiates OAuth and a
 * code_verifier is stored in cookies. Google redirects back here with
 * `?code=...` and we must exchange that code for a session on the server.
 * The server client will read the verifier cookie, call Supabase to get
 * session tokens, and write those tokens back to response cookies.
 *
 * A client-side page cannot do this reliably because of race conditions
 * with the Supabase client's URL auto-detection, and because cookies set
 * by the client storage adapter don't always propagate in time for SSR
 * pages that read the session on first load.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Google / Supabase returned an explicit OAuth error
  if (errorParam) {
    const msg = errorDescription || errorParam;
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(msg)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent("Missing OAuth code")}`
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent("Server misconfigured: missing Supabase env vars")}`
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a read-only context — ignore
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/`);
}
