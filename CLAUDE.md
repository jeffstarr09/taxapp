# DROP (dropfit.app) — AI-Powered Pushup Counter

## Project Overview

DROP is a fitness web app that uses your phone's camera and AI (TensorFlow.js MoveNet) to count pushups in real-time. It features leaderboards, social competition, and workout history tracking.

- **Live site:** https://dropfit.app (deployed via Vercel from `main` branch)
- **Repo:** jeffstarr09/taxapp (legacy name; app is "pushup-counter")

## Tech Stack

- **Framework:** Next.js 14.2 (App Router) with TypeScript 5.4, strict mode
- **Styling:** Tailwind CSS 3.4 — dark theme with custom `drop-*` color tokens
- **Backend:** Supabase (auth, Postgres DB, RLS policies)
- **AI/ML:** TensorFlow.js with MoveNet pose detection
- **Deployment:** Vercel (auto-deploys from `main`)

## Project Structure

```
src/
├── app/           # Next.js App Router pages
│   ├── page.tsx          # Homepage
│   ├── workout/page.tsx  # Core workout experience (camera + pose detection)
│   ├── leaderboard/page.tsx
│   ├── profile/page.tsx
│   ├── admin/page.tsx    # Admin dashboard (key: drop-admin-2024)
│   └── auth/page.tsx     # Auth/signup
├── components/    # React components
│   ├── CameraView.tsx    # Camera feed + pose detection + skeleton overlay
│   ├── WorkoutHUD.tsx    # Heads-up display during workout
│   ├── WorkoutSummary.tsx # Post-workout results
│   └── ...
├── lib/           # Utilities and core logic
│   ├── supabase.ts       # Singleton Supabase client (MUST stay singleton)
│   ├── storage.ts        # DB operations (saveWorkout, getLeaderboard, etc.)
│   ├── pushup-analyzer.ts # Rep counting logic with readiness checks
│   ├── pose-detection.ts  # TensorFlow MoveNet wrapper
│   ├── auth-context.tsx   # React auth context provider
│   ├── debug-log.ts       # Debug logger (writes to localStorage, shown on /admin)
│   └── ...
└── types/
    └── index.ts   # Shared TypeScript interfaces
```

## Build & Dev Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build (must pass for Vercel deploy)
npm run lint     # ESLint
```

## Key Architecture Decisions

### Supabase Client — Singleton Pattern
`src/lib/supabase.ts` uses a singleton. This is critical — creating a new client per call loses the auth session, which silently breaks workout saves (RLS rejects inserts when auth.uid() is null). Never change this to create fresh clients.

### Workout Save Pipeline
1. User finishes workout → `sessionResult` state is set
2. `useEffect` in `workout/page.tsx` auto-saves (no manual save button)
3. `saveWorkout()` in `storage.ts` verifies auth via `supabase.auth.getUser()`
4. Uses `user.id` from auth (not `profile.id`) as `user_id` to match RLS policy
5. Debug logs written to localStorage, viewable on `/admin` dashboard

### Fullscreen Workout Camera
- Uses React portals to escape stacking contexts
- CSS `body.workout-active` hides navbar during workout
- Camera forced to front-facing: `facingMode: { exact: "user" }` with fallback
- Skeleton drawn on canvas overlay with `scaleX(-1)` mirror

### Pushup Position Readiness
`pushup-analyzer.ts` requires:
- Full body visible including ankles (not just face/torso)
- Elbow angle > 130° (plank-like position)
- 45 consecutive frames (~1.5s) of stable detection
- This prevents false rep counting and premature guide dismissal

### Position Guide Overlay
- Image at `public/pushup-guide.png` (cyan pushup silhouette)
- Rotated 90° in portrait mode, normal in landscape (counter-rotation)
- Only disappears when `isAnalyzerReady()` returns true

### Leaderboard
- Backed by a Supabase VIEW (`leaderboard`) that aggregates workouts
- Filters out users with 0 reps
- Grouped by exercise_type

## Database Tables (Supabase)

- `profiles` — user profiles (id matches auth.uid)
- `workouts` — workout sessions (user_id, count, duration, etc.)
- `analytics_events` — event tracking
- `leaderboard` — VIEW aggregating workouts per user
- RLS enabled: users can insert own workouts, read all workouts

## Known Issues / Debug Tips

- **Workouts not saving?** Check `/admin` Debug Log section after doing a workout. Look for auth errors or RLS rejections.
- **Build fails with implicit any?** This project uses strict TypeScript. Always add explicit types for Supabase query results and callback parameters.
- **Build fails on prerender?** Supabase env vars aren't available at build time — prerender errors for pages using Supabase are expected on local builds without `.env.local`.
- **Camera not front-facing?** Uses `{ exact: "user" }` with fallback to `"user"`. Some devices may not support exact constraint.

## Style Guidelines

- Dark theme throughout — backgrounds use `neutral-800/900`, text is white/neutral
- Red accent color via `drop-*` tokens (e.g., `drop-600`, `text-drop-400`)
- Cards use `drop-card` CSS class
- No emojis in UI unless user requests them
- Mobile-first design — tested primarily on iPhone

## Parked Scope — "Project sit-up"

Bigger product bets tabled pending more user traction. Do not build without explicit re-confirmation.

1. **Points system** — unified cross-exercise score. Dual display (reps still hero metric, points as secondary). Proposed base values per rep: pushup=5, situp=2, squat=4, burpee=10, pullup=8, plank=2/10s. Form multiplier: `points = base × (form_score / 100)`. Compute client-side in `lib/points.ts` — no DB migration until values stabilize.
2. **Situps as second exercise type** — new `situp-analyzer.ts`, exercise picker on `/workout` setup, `public/situp-guide.png`, full-body readiness check. `workouts.exercise_type` column already supports it.
3. **Challenges feature** — user-created time-boxed contests. Types: volume-over-time, consistency-streak, race-to-goal, daily-target. One table with a `rule_type` discriminator. Personal trainer monetization angle parked until organic trainer demand appears.
