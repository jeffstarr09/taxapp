const REACTIONS_KEY = "drop_reactions";

export type ReactionType = "fire" | "clap" | "flex" | "star";

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  fire: "🔥",
  clap: "👏",
  flex: "💪",
  star: "⭐",
};

interface StoredReactions {
  [activityId: string]: {
    type: ReactionType;
    userId: string;
  }[];
}

function getAll(): StoredReactions {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem(REACTIONS_KEY) || "{}");
}

function saveAll(reactions: StoredReactions): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions));
}

export function addReaction(activityId: string, userId: string, type: ReactionType): void {
  const all = getAll();
  if (!all[activityId]) all[activityId] = [];
  const existing = all[activityId].findIndex((r) => r.userId === userId);
  if (existing >= 0) {
    if (all[activityId][existing].type === type) {
      all[activityId].splice(existing, 1);
    } else {
      all[activityId][existing].type = type;
    }
  } else {
    all[activityId].push({ type, userId });
  }
  saveAll(all);
}

export function getReactions(activityId: string): { type: ReactionType; userId: string }[] {
  const all = getAll();
  return all[activityId] || [];
}

export function getUserReaction(activityId: string, userId: string): ReactionType | null {
  const reactions = getReactions(activityId);
  const r = reactions.find((r) => r.userId === userId);
  return r?.type || null;
}
