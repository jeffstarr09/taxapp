import { User, WorkoutSession, LeaderboardEntry } from "@/types";
import { createClient } from "@/lib/supabase";

function getSupabase() {
  return createClient();
}

// ── Profile helpers ────────────────────────────────────────────

export async function getProfile(userId: string): Promise<User | null> {
  const { data } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return dbProfileToUser(data);
}

export async function getProfileByUsername(username: string): Promise<User | null> {
  const { data } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();
  if (!data) return null;
  return dbProfileToUser(data);
}

export async function updateProfile(
  userId: string,
  updates: { username?: string; display_name?: string; avatar_color?: string }
): Promise<void> {
  await getSupabase().from("profiles").update(updates).eq("id", userId);
}

function dbProfileToUser(row: {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
}): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
    friends: [], // loaded separately
  };
}

// ── Workout operations ─────────────────────────────────────────

export async function getWorkouts(userId?: string): Promise<WorkoutSession[]> {
  let query = getSupabase()
    .from("workouts")
    .select("*")
    .order("date", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data } = await query;
  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    count: row.count,
    duration: row.duration,
    averageFormScore: row.average_form_score,
    timestamps: row.timestamps ?? [],
    date: row.date,
    verified: row.verified,
  }));
}

export async function saveWorkout(workout: WorkoutSession): Promise<void> {
  await getSupabase().from("workouts").insert({
    id: workout.id,
    user_id: workout.userId,
    count: workout.count,
    duration: workout.duration,
    average_form_score: workout.averageFormScore,
    timestamps: workout.timestamps,
    date: workout.date,
    verified: workout.verified,
  });
}

// ── Leaderboard ────────────────────────────────────────────────

export async function getLeaderboard(
  friendsOnly: boolean = false,
  currentUserId?: string
): Promise<LeaderboardEntry[]> {
  // Use the database view for global leaderboard
  const { data } = await getSupabase()
    .from("leaderboard")
    .select("*")
    .order("total_pushups", { ascending: false });

  if (!data) return [];

  let entries: LeaderboardEntry[] = data.map((row) => ({
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    totalPushups: row.total_pushups,
    bestSession: row.best_session,
    averageForm: row.average_form,
    workoutCount: row.workout_count,
    streak: 0, // computed client-side for now
  }));

  if (friendsOnly && currentUserId) {
    const friendIds = await getFriendIds(currentUserId);
    const allowed = new Set([currentUserId, ...friendIds]);
    entries = entries.filter((e) => allowed.has(e.userId));
  }

  return entries;
}

// ── Friends ────────────────────────────────────────────────────

export async function getFriendIds(userId: string): Promise<string[]> {
  const { data } = await getSupabase()
    .from("friendships")
    .select("friend_id")
    .eq("user_id", userId);
  return data?.map((r) => r.friend_id) ?? [];
}

export async function getFriends(userId: string): Promise<User[]> {
  const ids = await getFriendIds(userId);
  if (ids.length === 0) return [];
  const { data } = await getSupabase()
    .from("profiles")
    .select("*")
    .in("id", ids);
  return data?.map(dbProfileToUser) ?? [];
}

export async function addFriend(userId: string, friendId: string): Promise<void> {
  // Add both directions for bidirectional friendship
  await getSupabase().from("friendships").upsert([
    { user_id: userId, friend_id: friendId },
    { user_id: friendId, friend_id: userId },
  ]);
}

// ── Legacy sync helpers (for backward compat during transition) ──

/** @deprecated Use useAuth() hook instead */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem("pushup_current_user");
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

/** @deprecated Use useAuth() hook instead */
export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("pushup_current_user", JSON.stringify(user));
}

// ── Seed demo data (no-op when Supabase is connected) ──────────

export function seedDemoData(): void {
  // Demo data is no longer needed — real users populate the leaderboard.
  // This is kept as a no-op so existing page calls don't break.
}
