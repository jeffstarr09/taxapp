import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/notifications/test
 *
 * Sends a "this is a test" push to the signed-in user's registered devices.
 * Useful from the profile screen after they install the app to verify the
 * APNs pipeline is wired up correctly.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* read-only context */
        }
      },
    },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Optional body lets us override the message for one-off use
  let title = "DROP test 🧪";
  let body = "Push notifications are working. Now go do some pushups.";
  try {
    const json = await request.json();
    if (typeof json?.title === "string") title = json.title;
    if (typeof json?.body === "string") body = json.body;
  } catch {
    /* empty body is fine */
  }

  // Call the send-push Edge Function. Use the service role key if available so
  // we bypass RLS on push_tokens; otherwise fall back to the user's own session.
  const fnRes = await fetch(`${url}/functions/v1/send-push`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${serviceKey ?? anonKey}`,
    },
    body: JSON.stringify({
      user_id: user.id,
      category: "milestone",
      title,
      body,
      ignore_quiet_hours: true,
      data: { test: true, url: "/profile" },
    }),
  });

  const result = await fnRes.json().catch(() => ({}));
  return NextResponse.json(result, { status: fnRes.status });
}
