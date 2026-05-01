import { User, WorkoutSession, LeaderboardEntry, ExerciseType, LeaderboardPeriod } from "@/types";
import { createClient } from "@/lib/supabase";
import { debugLog, debugError, debugWarn } from "@/lib/debug-log";
import { periodStart } from "@/lib/period";
import { caloriesForReps } from "@/lib/calories";

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
  updates: { username?: string; display_name?: string; avatar_color?: string; avatar_url?: string | null }
): Promise<void> {
  await getSupabase().from("profiles").update(updates).eq("id", userId);
}

function dbProfileToUser(row: {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_url?: string | null;
  created_at: string;
}): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at,
    friends: [], // loaded separately
  };
}

export async function searchProfiles(query: string, limit: number = 10): Promise<User[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  const { data } = await getSupabase()
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
    .limit(limit);
  if (!data) return [];
  return data.map(dbProfileToUser);
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
  let { data: { user }, error: authError } = await supabase.auth.getUser();
  debugLog("Auth check", { userId: user?.id, authError: authError?.message, workoutUserId: workout.userId });

  // If auth check failed, try refreshing the session once (helps in private
  // browsing where the session token may have been evicted).
  if (!user || authError) {
    debugWarn("Auth check failed, attempting session refresh");
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError) {
      const retry = await supabase.auth.getUser();
      user = retry.data.user;
      authError = retry.error;
      debugLog("Post-refresh auth check", { userId: user?.id, authError: authError?.message });
    }
  }

  if (!user) {
    debugError("Not authenticated — no user from auth.getUser()");
    throw new Error("Not authenticated — sign in to save workouts");
  }
  if (user.id !== workout.userId) {
    debugWarn("User ID mismatch!", { authUid: user.id, workoutUserId: workout.userId });
  }

  const insertData = {
    id: workout.id,
    user_id: user.id,
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
  exerciseType?: ExerciseType | "all",
  period: LeaderboardPeriod = "all"
): Promise<LeaderboardEntry[]> {
  const exType = exerciseType === "all" ? undefined : exerciseType;
  // "all" period uses the precomputed Supabase view for speed.
  // Time-scoped periods aggregate the workouts table client-side so they
  // stay accurate without a schema migration.
  if (period === "all") {
    return getLeaderboardAllTime(friendsOnly, currentUserId, exType);
  }
  return getLeaderboardForPeriod(period, friendsOnly, currentUserId, exType);
}

async function getLeaderboardAllTime(
  friendsOnly: boolean,
  currentUserId: string | undefined,
  exerciseType: ExerciseType | undefined
): Promise<LeaderboardEntry[]> {
  let query = getSupabase()
    .from("leaderboard")
    .select("*")
    .order("total_reps", { ascending: false });

  if (exerciseType) {
    if (friendsOnly) {
      // For friends view: include matching exercise_type OR null (no workouts yet)
      query = query.or(`exercise_type.eq.${exerciseType},exercise_type.is.null`);
    } else {
      query = query.eq("exercise_type", exerciseType);
    }
  }

  const { data } = await query;
  if (!data) return [];

  // When no exercise filter is set, aggregate rows across exercise types per user
  type RawRow = {
    user_id: string; username: string; display_name: string;
    avatar_color: string; avatar_url: string | null; exercise_type: string | null;
    total_reps: number; best_session: number; average_form: number; workout_count: number;
  };

  let entries: LeaderboardEntry[];
  if (!exerciseType) {
    const byUser = new Map<string, LeaderboardEntry>();
    for (const row of data as RawRow[]) {
      const uid = row.user_id;
      const exType = (row.exercise_type as ExerciseType) ?? "pushup";
      const cals = caloriesForReps(exType, row.total_reps ?? 0);
      const prev = byUser.get(uid);
      if (prev) {
        prev.totalReps += row.total_reps ?? 0;
        prev.totalCalories += cals;
        prev.bestSession = Math.max(prev.bestSession, row.best_session ?? 0);
        prev.workoutCount += row.workout_count ?? 0;
      } else {
        byUser.set(uid, {
          userId: uid,
          username: row.username,
          displayName: row.display_name,
          avatarColor: row.avatar_color,
          avatarUrl: row.avatar_url ?? null,
          totalReps: row.total_reps ?? 0,
          totalCalories: cals,
          bestSession: row.best_session ?? 0,
          averageForm: row.average_form ?? 0,
          workoutCount: row.workout_count ?? 0,
          streak: 0,
        });
      }
    }
    entries = Array.from(byUser.values()).sort((a, b) => b.totalReps - a.totalReps);
  } else {
    entries = data.map((row: Record<string, unknown>) => {
      const reps = (row.total_reps as number) ?? 0;
      return {
        userId: row.user_id as string,
        username: row.username as string,
        displayName: row.display_name as string,
        avatarColor: row.avatar_color as string,
        avatarUrl: (row.avatar_url as string) ?? null,
        totalReps: reps,
        totalCalories: caloriesForReps(exerciseType, reps),
        bestSession: (row.best_session as number) ?? 0,
        averageForm: (row.average_form as number) ?? 0,
        workoutCount: (row.workout_count as number) ?? 0,
        streak: 0,
      };
    });
  }

  if (friendsOnly && currentUserId) {
    const friendIds = await getFriendIds(currentUserId);
    const allowed = new Set([currentUserId, ...friendIds]);
    entries = entries.filter((e) => allowed.has(e.userId));
  } else {
    // Global leaderboard: only show users with at least 1 rep
    entries = entries.filter((e) => e.totalReps > 0);
  }

  return await hydrateAvatars(entries);
}

async function getLeaderboardForPeriod(
  period: LeaderboardPeriod,
  friendsOnly: boolean,
  currentUserId: string | undefined,
  exerciseType: ExerciseType | undefined
): Promise<LeaderboardEntry[]> {
  const since = periodStart(period);
  if (!since) return [];

  let query = getSupabase()
    .from("workouts")
    .select("user_id, count, average_form_score, exercise_type, date")
    .gte("date", since.toISOString());

  if (exerciseType) {
    query = query.eq("exercise_type", exerciseType);
  }

  // If we're in Friends mode, pre-filter on the server to avoid pulling
  // the full global workout set into the client.
  let friendScope: string[] | null = null;
  if (friendsOnly && currentUserId) {
    const friendIds = await getFriendIds(currentUserId);
    friendScope = [currentUserId, ...friendIds];
    query = query.in("user_id", friendScope);
  }

  const { data } = await query;
  if (!data || data.length === 0) {
    // In Friends mode we still want to render the current user / friends
    // even when nobody has logged a workout this period — the page falls
    // back to profile-only rows below.
    if (friendsOnly && friendScope) {
      return hydrateAvatars(await buildEmptyEntriesForUsers(friendScope));
    }
    return [];
  }

  // Aggregate per user.
  type Agg = { totalReps: number; totalCalories: number; bestSession: number; formSum: number; workoutCount: number };
  const byUser = new Map<string, Agg>();
  for (const row of data as { user_id: string; count: number; average_form_score: number; exercise_type?: string }[]) {
    const exType = (row.exercise_type as ExerciseType) ?? "pushup";
    const prev = byUser.get(row.user_id) ?? {
      totalReps: 0,
      totalCalories: 0,
      bestSession: 0,
      formSum: 0,
      workoutCount: 0,
    };
    prev.totalReps += row.count ?? 0;
    prev.totalCalories += caloriesForReps(exType, row.count ?? 0);
    prev.bestSession = Math.max(prev.bestSession, row.count ?? 0);
    prev.formSum += row.average_form_score ?? 0;
    prev.workoutCount += 1;
    byUser.set(row.user_id, prev);
  }

  const userIds = Array.from(byUser.keys());
  const { data: profiles } = await getSupabase()
    .from("profiles")
    .select("id, username, display_name, avatar_color, avatar_url")
    .in("id", userIds);

  const profileMap = new Map<
    string,
    { username: string; display_name: string; avatar_color: string; avatar_url: string | null }
  >();
  for (const p of (profiles ?? []) as {
    id: string;
    username: string;
    display_name: string;
    avatar_color: string;
    avatar_url: string | null;
  }[]) {
    profileMap.set(p.id, p);
  }

  let entries: LeaderboardEntry[] = userIds
    .map((uid) => {
      const agg = byUser.get(uid)!;
      const p = profileMap.get(uid);
      return {
        userId: uid,
        username: p?.username ?? "unknown",
        displayName: p?.display_name ?? "Unknown",
        avatarColor: p?.avatar_color ?? "#6b7280",
        avatarUrl: p?.avatar_url ?? null,
        totalReps: agg.totalReps,
        totalCalories: agg.totalCalories,
        bestSession: agg.bestSession,
        averageForm: agg.workoutCount > 0 ? Math.round(agg.formSum / agg.workoutCount) : 0,
        workoutCount: agg.workoutCount,
        streak: 0,
      };
    })
    .filter((e) => e.totalReps > 0)
    .sort((a, b) => b.totalReps - a.totalReps);

  // In Friends mode, also surface friends who haven't logged this period
  // so users still see their network ranked (just at the bottom with 0).
  if (friendsOnly && friendScope) {
    const present = new Set(entries.map((e) => e.userId));
    const missing = friendScope.filter((id) => !present.has(id));
    if (missing.length > 0) {
      const empties = await buildEmptyEntriesForUsers(missing);
      entries = [...entries, ...empties];
    }
  }

  return entries;
}

async function buildEmptyEntriesForUsers(userIds: string[]): Promise<LeaderboardEntry[]> {
  if (userIds.length === 0) return [];
  const { data } = await getSupabase()
    .from("profiles")
    .select("id, username, display_name, avatar_color, avatar_url")
    .in("id", userIds);
  if (!data) return [];
  return (data as {
    id: string;
    username: string;
    display_name: string;
    avatar_color: string;
    avatar_url: string | null;
  }[]).map((p) => ({
    userId: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarColor: p.avatar_color,
    avatarUrl: p.avatar_url ?? null,
    totalReps: 0,
    totalCalories: 0,
    bestSession: 0,
    averageForm: 0,
    workoutCount: 0,
    streak: 0,
  }));
}

async function hydrateAvatars(entries: LeaderboardEntry[]): Promise<LeaderboardEntry[]> {
  // The leaderboard view may have been created before avatar_url was added
  // to the profiles table, in which case row.avatar_url is missing. Batch-
  // fetch the current avatar_url for every entry directly from profiles so
  // photos show up on the leaderboard regardless of view age.
  if (entries.length === 0) return entries;
  const ids = entries.map((e) => e.userId);
  const { data: profileRows } = await getSupabase()
    .from("profiles")
    .select("id, avatar_url")
    .in("id", ids);
  if (!profileRows) return entries;
  const urlMap = new Map<string, string | null>();
  for (const p of profileRows as { id: string; avatar_url: string | null }[]) {
    urlMap.set(p.id, p.avatar_url ?? null);
  }
  return entries.map((e) => ({
    ...e,
    avatarUrl: urlMap.get(e.userId) ?? e.avatarUrl,
  }));
}

// ── Friends ────────────────────────────────────────────────────

export async function getFriendIds(userId: string): Promise<string[]> {
  // Query both directions since we can only insert our own row (RLS)
  const { data, error } = await getSupabase()
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
  debugLog("getFriendIds query", { userId, rows: data?.length, error: error?.message, data });
  if (!data) return [];
  const ids = new Set<string>();
  for (const r of data as { user_id: string; friend_id: string }[]) {
    if (r.user_id === userId) ids.add(r.friend_id);
    else ids.add(r.user_id);
  }
  const result = Array.from(ids);
  debugLog("getFriendIds result", { friendIds: result });
  return result;
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
  debugLog("addFriend called", { userId, friendId });
  const { error, data } = await getSupabase()
    .from("friendships")
    .upsert(
      [{ user_id: userId, friend_id: friendId }],
      { onConflict: "user_id,friend_id", ignoreDuplicates: true }
    )
    .select();
  debugLog("addFriend result", { error: error?.message, data });
  if (error) {
    // Postgres unique-violation (23505) means the friendship already
    // exists; treat as a no-op so the UI can advance instead of
    // surfacing "Something went wrong" to the user.
    if (error.code === "23505") {
      debugLog("addFriend: friendship already exists, treating as success");
      return;
    }
    debugError("addFriend failed", { code: error.code, message: error.message, details: error.details });
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

// ── Activity Feed ─────────────────────────────────────────────

export async function getActivityFeed(userId: string): Promise<import("@/types").ActivityFeedItem[]> {
  const friendIds = await getFriendIds(userId);
  const allIds = [userId, ...friendIds];
  if (allIds.length === 0) return [];

  const { data } = await getSupabase()
    .from("workouts")
    .select("id, user_id, exercise_type, count, date")
    .in("user_id", allIds)
    .order("date", { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return [];

  // Batch-fetch profiles for all users in the feed
  const userIds = Array.from(new Set(data.map((w: Record<string, unknown>) => w.user_id as string)));
  // Try with avatar_url first, fall back without it if column doesn't exist yet
  let profiles: Record<string, unknown>[] | null = null;
  let profileError: { message: string } | null = null;
  const result1 = await getSupabase()
    .from("profiles")
    .select("id, username, display_name, avatar_color, avatar_url")
    .in("id", userIds);
  if (result1.error) {
    // avatar_url column may not exist yet — retry without it
    debugWarn("Activity feed: avatar_url query failed, retrying without it", { error: result1.error.message });
    const result2 = await getSupabase()
      .from("profiles")
      .select("id, username, display_name, avatar_color")
      .in("id", userIds);
    profiles = result2.data as Record<string, unknown>[] | null;
    profileError = result2.error;
  } else {
    profiles = result1.data as Record<string, unknown>[] | null;
    profileError = result1.error;
  }

  debugLog("Activity feed profile fetch", { userIds, profileCount: profiles?.length, error: profileError?.message });

  const profileMap = new Map<string, { username: string; display_name: string; avatar_color: string; avatar_url?: string | null }>();
  for (const p of (profiles ?? []) as { id: string; username: string; display_name: string; avatar_color: string; avatar_url?: string | null }[]) {
    profileMap.set(p.id, p);
  }

  return data.map((w: Record<string, unknown>) => {
    const p = profileMap.get(w.user_id as string);
    return {
      id: w.id as string,
      userId: w.user_id as string,
      username: p?.username ?? "unknown",
      displayName: p?.display_name ?? "Unknown",
      avatarColor: p?.avatar_color ?? "#666",
      avatarUrl: p?.avatar_url ?? null,
      exerciseType: (w.exercise_type as import("@/types").ExerciseType) ?? "pushup",
      count: w.count as number,
      date: w.date as string,
    };
  });
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
