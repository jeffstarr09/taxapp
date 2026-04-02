import { User, WorkoutSession, LeaderboardEntry, ExerciseType } from "@/types";
import { createClient } from "@/lib/supabase";
import { debugLog, debugError, debugWarn } from "@/lib/debug-log";

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

export async function getWorkouts(
  userId?: string,
  exerciseType?: ExerciseType
): Promise<WorkoutSession[]> {
  let query = getSupabase()
    .from("workouts")
    .select("*")
    .order("date", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (exerciseType) {
    query = query.eq("exercise_type", exerciseType);
  }

  const { data } = await query;
  if (!data) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    userId: row.user_id as string,
    exerciseType: (row.exercise_type as ExerciseType) ?? "pushup",
    count: row.count as number,
    duration: row.duration as number,
    averageFormScore: row.average_form_score as number,
    timestamps: (row.timestamps as number[]) ?? [],
    date: row.date as string,
    verified: row.verified as boolean,
  }));
}

export async function saveWorkout(workout: WorkoutSession): Promise<void> {
  const supabase = getSupabase();

  // Verify we have an authenticated session before attempting insert
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  debugLog("Auth check", { userId: user?.id, authError: authError?.message, workoutUserId: workout.userId });
  if (!user) {
    debugError("Not authenticated — no user from auth.getUser()");
    throw new Error("Not authenticated — sign in to save workouts");
  }
  if (user.id !== workout.userId) {
    debugWarn("User ID mismatch!", { authUid: user.id, workoutUserId: workout.userId });
  }

  const insertData = {
    id: workout.id,
    user_id: user.id,  // Use auth user ID directly to match RLS policy
    exercise_type: workout.exerciseType,
    count: workout.count,
    duration: workout.duration,
    average_form_score: workout.averageFormScore,
    timestamps: workout.timestamps,
    date: workout.date,
    verified: workout.verified,
  };
  debugLog("Inserting workout", insertData);

  const { error, data } = await supabase.from("workouts").insert(insertData).select();
  if (error) {
    debugError("Insert failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    throw new Error(error.message);
  }
  debugLog("Insert succeeded", { returnedRows: data?.length });
}

// ── Leaderboard ────────────────────────────────────────────────

export async function getLeaderboard(
  friendsOnly: boolean = false,
  currentUserId?: string,
  exerciseType?: ExerciseType
): Promise<LeaderboardEntry[]> {
  let query = getSupabase()
    .from("leaderboard")
    .select("*")
    .order("total_reps", { ascending: false });

  if (exerciseType) {
    query = query.eq("exercise_type", exerciseType);
  }

  const { data } = await query;
  if (!data) return [];

  let entries: LeaderboardEntry[] = data
    .filter((row: Record<string, unknown>) => (row.total_reps as number) > 0)
    .map((row: Record<string, unknown>) => ({
      userId: row.user_id as string,
      username: row.username as string,
      displayName: row.display_name as string,
      avatarColor: row.avatar_color as string,
      totalReps: row.total_reps as number,
      bestSession: row.best_session as number,
      averageForm: row.average_form as number,
      workoutCount: row.workout_count as number,
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
  // Query both directions since we can only insert our own row (RLS)
  const { data } = await getSupabase()
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
  if (!data) return [];
  const ids = new Set<string>();
  for (const r of data as { user_id: string; friend_id: string }[]) {
    if (r.user_id === userId) ids.add(r.friend_id);
    else ids.add(r.user_id);
  }
  return Array.from(ids);
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
  // Insert only the current user's row (RLS only allows auth.uid() = user_id).
  // getFriendIds queries both directions, so one row is sufficient.
  const { error } = await getSupabase().from("friendships").upsert([
    { user_id: userId, friend_id: friendId },
  ]);
  if (error) {
    console.error("Failed to add friend:", error);
    throw new Error(error.message);
  }
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  // Remove both possible directions
  await getSupabase()
    .from("friendships")
    .delete()
    .eq("user_id", userId)
    .eq("friend_id", friendId);
}

// ── Legacy sync helpers (for backward compat during transition) ──

/** @deprecated Use useAuth() hook instead */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem("drop_current_user");
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

/** @deprecated Use useAuth() hook instead */
export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("drop_current_user", JSON.stringify(user));
}

// ── Seed demo data (no-op when Supabase is connected) ──────────

export function seedDemoData(): void {
  // Demo data is no longer needed — real users populate the leaderboard.
  // This is kept as a no-op so existing page calls don't break.
}
