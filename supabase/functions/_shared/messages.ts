// Server-side notification copy. Mirrors src/lib/motivation.ts but
// runs on Deno and is used by Edge Functions for push delivery.

export type MotivationTier = "motivational" | "push_me" | "roast_me";

interface CategoryMessages {
  streakAtRisk: string[];
  streakBroken: string[];
  comeBack1Day: string[];
  comeBack3Days: string[];
  comeBack7Days: string[];
  milestone: string[];
}

const MESSAGES: Record<MotivationTier, CategoryMessages> = {
  motivational: {
    streakAtRisk: [
      "Don't break your streak — work out today!",
      "Your {streak}-day streak is counting on you.",
      "One workout keeps the streak alive.",
      "You've come this far. Keep it going.",
    ],
    streakBroken: [
      "Fresh start. Let's build it back up.",
      "Yesterday's gone. Today is what matters.",
    ],
    comeBack1Day: [
      "We missed you yesterday. Ready to get back at it?",
      "One day off is recovery. Make today count.",
    ],
    comeBack3Days: [
      "Your body is ready to move.",
      "3 days off — perfect rest. Now let's go.",
    ],
    comeBack7Days: [
      "It's been a week. Your muscles miss you.",
      "A week off can be a reset. Come back stronger.",
    ],
    milestone: [
      "You hit {count} reps! Huge.",
      "{count} reps logged. Keep climbing.",
    ],
  },
  push_me: {
    streakAtRisk: [
      "Your streak dies at midnight. Move.",
      "{streak} days. Don't throw it away today.",
      "Stop scrolling. One workout. Go.",
      "Clock's ticking. Streak isn't going to save itself.",
    ],
    streakBroken: [
      "Streak's gone. How fast can you build it back?",
      "Back to zero. That should bother you.",
    ],
    comeBack1Day: [
      "Yesterday was rest. Today isn't. Get moving.",
      "One day off — fine. Two is a pattern.",
    ],
    comeBack3Days: [
      "3 days. The leaderboard isn't waiting.",
      "People are passing you while you sit this out.",
    ],
    comeBack7Days: [
      "A full week. Your competition didn't take a week off.",
      "7 days. That's not rest — that's quitting in slow motion.",
    ],
    milestone: [
      "{count} reps. Now do more next time.",
      "{count}. Solid. But you've got more in you.",
    ],
  },
  roast_me: {
    streakAtRisk: [
      "Your streak is about to die and honestly? It saw this coming.",
      "Midnight's coming. Your streak is picking out a casket.",
      "{streak} days, about to be zero. Pathetic.",
      "Skip today and your jeans are gonna start filing noise complaints.",
    ],
    streakBroken: [
      "Streak's dead. Cause of death: you being you.",
      "Back to zero. Fitting.",
    ],
    comeBack1Day: [
      "One day off and you're already getting soft. Softer. Whatever.",
      "Yesterday you chose the couch. Your body chose to store that pizza.",
    ],
    comeBack3Days: [
      "3 days MIA. Did you forget how to do a pushup?",
      "3 days. Your fridge did more reps than you.",
    ],
    comeBack7Days: [
      "A whole week? I forgot you existed. So did your fitness goals.",
      "7 days. Your body has officially entered storage mode.",
    ],
    milestone: [
      "{count} reps. Adorable. Bare minimum is still minimum.",
      "{count}. Don't celebrate. Your form is still trash.",
    ],
  },
};

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    String(vars[k] ?? `{${k}}`)
  );
}

export function streakAtRiskMessage(
  tier: MotivationTier,
  streak: number
): { title: string; body: string } {
  const body = fill(pick(MESSAGES[tier].streakAtRisk), { streak });
  return { title: `🔥 ${streak}-day streak at risk`, body };
}

export function comeBackMessage(
  tier: MotivationTier,
  daysInactive: number
): { title: string; body: string } {
  let pool: string[];
  let title: string;
  if (daysInactive >= 7) {
    pool = MESSAGES[tier].comeBack7Days;
    title = "Where you been?";
  } else if (daysInactive >= 3) {
    pool = MESSAGES[tier].comeBack3Days;
    title = "DROP misses you";
  } else {
    pool = MESSAGES[tier].comeBack1Day;
    title = "Get back at it";
  }
  return { title, body: pick(pool) };
}

export function milestoneMessage(
  tier: MotivationTier,
  count: number
): { title: string; body: string } {
  const body = fill(pick(MESSAGES[tier].milestone), { count });
  return { title: "🏆 Milestone unlocked", body };
}
