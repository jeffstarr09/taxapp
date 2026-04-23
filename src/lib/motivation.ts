export type MotivationTier = "motivational" | "push_me" | "roast_me";

export const MOTIVATION_TIERS: { value: MotivationTier; label: string; description: string }[] = [
  { value: "motivational", label: "Motivational", description: "Supportive and encouraging" },
  { value: "push_me", label: "Push Me", description: "Honest and direct" },
  { value: "roast_me", label: "Roast Me", description: "No mercy. You asked for it." },
];

const PREF_KEY = "drop_motivation_tier";

export function getMotivationTier(): MotivationTier {
  if (typeof window === "undefined") return "motivational";
  return (localStorage.getItem(PREF_KEY) as MotivationTier) || "motivational";
}

export function setMotivationTier(tier: MotivationTier): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREF_KEY, tier);
}

interface MessageSet {
  streakActive: string[];
  streakAtRisk: string[];
  streakBroken: string[];
  comeBack1Day: string[];
  comeBack3Days: string[];
  comeBack7Days: string[];
  postWorkout: string[];
}

const MESSAGES: Record<MotivationTier, MessageSet> = {
  motivational: {
    streakActive: [
      "Keep it going! You're building something great.",
      "Consistency is king. You're on fire.",
      "Another day, another step closer to your goals.",
      "Your future self is thanking you right now.",
    ],
    streakAtRisk: [
      "Don't break your streak — work out today!",
      "You've come so far. One more workout keeps it alive.",
      "Your streak is counting on you today.",
      "Just one set. That's all it takes to keep going.",
    ],
    streakBroken: [
      "Day 1 — every champion starts here.",
      "Fresh start. Let's build it back up.",
      "Yesterday's gone. Today is what matters.",
    ],
    comeBack1Day: [
      "We missed you yesterday! Ready to get back at it?",
      "One day off is recovery. Let's make today count.",
    ],
    comeBack3Days: [
      "It's been a few days — your body is ready to move!",
      "3 days off? Perfect rest. Now let's go.",
    ],
    comeBack7Days: [
      "It's been a week! Your muscles miss you.",
      "A week off can be a reset. Come back stronger.",
    ],
    postWorkout: [
      "Great work! You showed up and that's what matters.",
      "Another one in the books. Keep stacking them.",
    ],
  },

  push_me: {
    streakActive: [
      "Streak's alive. But alive isn't impressive — push harder.",
      "Good. Now do more than yesterday.",
      "You showed up. That's the minimum. What else you got?",
      "Don't get comfortable. Comfortable doesn't win.",
    ],
    streakAtRisk: [
      "Your streak dies at midnight. You really gonna let that happen?",
      "One workout. That's it. Stop making excuses.",
      "Clock's ticking. Your streak isn't going to save itself.",
      "You didn't build this streak to throw it away today.",
    ],
    streakBroken: [
      "Streak's gone. How fast can you build it back?",
      "Back to zero. That should bother you.",
      "You lost it. Now earn it back.",
    ],
    comeBack1Day: [
      "Yesterday was a rest day. Today isn't. Get moving.",
      "One day off — fine. Two is a pattern. Don't make it two.",
    ],
    comeBack3Days: [
      "3 days and counting. The leaderboard isn't waiting for you.",
      "People are passing you while you sit this out.",
    ],
    comeBack7Days: [
      "A full week off? Your competition didn't take a week off.",
      "7 days. That's not a rest — that's quitting in slow motion.",
    ],
    postWorkout: [
      "Solid. But can you do more next time?",
      "Done. Now come back tomorrow and beat that.",
    ],
  },

  roast_me: {
    streakActive: [
      "Oh wow, you worked out. Want a trophy for doing the bare minimum?",
      "Streak's alive but let's be real — so is your grandma's and she's doing more reps.",
      "Congrats on not being a complete couch potato today.",
      "Still going? Shocking. I had money on you quitting by now.",
    ],
    streakAtRisk: [
      "Your streak is about to die and honestly? It saw this coming.",
      "Midnight's coming. Your streak is writing its will.",
      "One workout to save your streak but we both know you're eyeing the couch.",
      "Your streak believed in you. Don't make it die disappointed.",
    ],
    streakBroken: [
      "Streak's dead. It didn't even get a funeral — just neglect.",
      "Back to zero. Just like your motivation.",
      "RIP streak. Cause of death: you.",
      "Day 1 again. At this rate you'll have more Day 1s than reps.",
    ],
    comeBack1Day: [
      "One day off and you're already getting soft. Literally.",
      "Yesterday you chose the couch. The couch doesn't care about your goals.",
    ],
    comeBack3Days: [
      "3 days MIA. Did you get lost on the way to the workout page?",
      "Haven't seen you in 3 days. Even your avatar looks out of shape.",
      "3 days off. Your leaderboard rank is in witness protection.",
    ],
    comeBack7Days: [
      "A whole week? I thought this app got uninstalled.",
      "7 days. Even your phone's battery works out more than you do.",
      "A week off — your muscles forgot your name.",
      "You've been gone so long the leaderboard filed a missing persons report.",
    ],
    postWorkout: [
      "You actually did it? I'm genuinely shocked. Don't let it go to your head.",
      "Not bad. For someone who almost didn't show up.",
      "Look at you, exercising like a real person. Wild.",
    ],
  },
};

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getStreakMessage(
  streak: number,
  workedOutToday: boolean,
  isAtRisk: boolean,
  tier?: MotivationTier
): string {
  const t = tier || getMotivationTier();
  const msgs = MESSAGES[t];

  if (streak > 0 && workedOutToday) return pickRandom(msgs.streakActive);
  if (streak > 0 && isAtRisk) return pickRandom(msgs.streakAtRisk);
  return pickRandom(msgs.streakBroken);
}

export function getComeBackMessage(daysInactive: number, tier?: MotivationTier): string {
  const t = tier || getMotivationTier();
  const msgs = MESSAGES[t];

  if (daysInactive >= 7) return pickRandom(msgs.comeBack7Days);
  if (daysInactive >= 3) return pickRandom(msgs.comeBack3Days);
  return pickRandom(msgs.comeBack1Day);
}

export function getPostWorkoutMessage(tier?: MotivationTier): string {
  const t = tier || getMotivationTier();
  return pickRandom(MESSAGES[t].postWorkout);
}
