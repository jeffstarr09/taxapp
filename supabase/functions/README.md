# DROP — Supabase Edge Functions for Push Notifications

This directory contains two Edge Functions:

- `send-push` — sends a single push notification via APNs to a specific user
- `streak-reminder-cron` — runs on a schedule, finds users with at-risk streaks
  or comeback opportunities, and sends them an APNs push

The shared APNs signing helper lives in `_shared/apns.ts`. Server-side
notification copy lives in `_shared/messages.ts`.

## Prerequisites

You'll need an active Apple Developer Program enrollment (Organization, ideally,
once your LLC is set up), a paid account, and:

1. **APNs Authentication Key (.p8)** — Apple Developer → Certificates, IDs &
   Profiles → Keys → New Key → enable "Apple Push Notifications service (APNs)".
   Download the .p8 file (you can only download it once). Note the **Key ID**.
2. **Team ID** — top right of the Apple Developer console.
3. **Bundle ID** — `app.dropfit.drop` (matches `capacitor.config.ts`).

## Setting Edge Function secrets

```bash
# from repo root
supabase login

# Set APNs credentials
supabase secrets set APNS_KEY_ID=ABC123XYZ9
supabase secrets set APNS_TEAM_ID=DEF456UVW0
supabase secrets set APNS_BUNDLE_ID=app.dropfit.drop
supabase secrets set APNS_USE_SANDBOX=true   # true while running on TestFlight/dev builds, false for prod

# Set the .p8 contents (preserve newlines!)
supabase secrets set --env-file <(cat <<EOF
APNS_PRIVATE_KEY=$(cat /path/to/AuthKey_ABC123XYZ9.p8)
EOF
)
```

> Note: Apple's APNs treats the **same** key for sandbox and production. The
> `APNS_USE_SANDBOX` flag controls which Apple host we hit. TestFlight builds
> still use the production host, but **builds run from Xcode directly to a
> physical device** use the sandbox host.

## Deploying the functions

```bash
supabase functions deploy send-push
supabase functions deploy streak-reminder-cron
```

## Scheduling the cron

In the Supabase Dashboard:

1. Go to **Database → Cron Jobs** (uses pg_cron under the hood)
2. Create a job that runs hourly:
   ```sql
   select cron.schedule(
     'streak-reminder-cron-hourly',
     '0 * * * *',
     $$
     select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/streak-reminder-cron',
       headers := jsonb_build_object(
         'authorization', 'Bearer <service-role-key>',
         'content-type', 'application/json'
       ),
       body := '{}'::jsonb
     ) as request_id;
     $$
   );
   ```

The cron function gates on the user's local time (from
`notification_preferences.timezone_offset_minutes`), so it's safe to run hourly
— it only sends pushes during each user's evening window (default 6-9 PM local).

## Manual test

After deploying, hit the function with curl:

```bash
curl -X POST 'https://<project-ref>.supabase.co/functions/v1/send-push' \
  -H 'authorization: Bearer <service-role-key>' \
  -H 'content-type: application/json' \
  -d '{
    "user_id": "<your-user-uuid>",
    "category": "milestone",
    "title": "Test",
    "body": "Hello from DROP",
    "ignore_quiet_hours": true
  }'
```

Or use the in-app **Send test notification** button on the profile screen, which
calls `/api/notifications/test` → `send-push`.

## Debugging

- All sends are logged to `notification_log` (visible to admins via service role)
- Failed sends with status 410 / `BadDeviceToken` / `Unregistered` automatically
  flip the `push_tokens.active` flag to `false`, so dead tokens drop out
- Check function logs in Supabase Dashboard → Edge Functions → Logs

## Sandbox vs. production reference

| Build path                    | APNs host                       | `APNS_USE_SANDBOX` |
|-------------------------------|----------------------------------|--------------------|
| Xcode → physical device       | api.sandbox.push.apple.com       | `true`             |
| TestFlight                    | api.push.apple.com               | `false`            |
| App Store production          | api.push.apple.com               | `false`            |

Once you ship to TestFlight, flip `APNS_USE_SANDBOX=false` and redeploy.
