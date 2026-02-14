import { User, WorkoutSession, LeaderboardEntry } from "@/types";

const STORAGE_KEYS = {
  CURRENT_USER: "pushup_current_user",
  USERS: "pushup_users",
  WORKOUTS: "pushup_workouts",
} as const;

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// User operations
export function getCurrentUser(): User | null {
  return getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User): void {
  setToStorage(STORAGE_KEYS.CURRENT_USER, user);
  const users = getAllUsers();
  const existing = users.findIndex((u) => u.id === user.id);
  if (existing >= 0) {
    users[existing] = user;
  } else {
    users.push(user);
  }
  setToStorage(STORAGE_KEYS.USERS, users);
}

export function getAllUsers(): User[] {
  return getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
}

export function getUserById(id: string): User | undefined {
  return getAllUsers().find((u) => u.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return getAllUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

// Workout operations
export function getWorkouts(userId?: string): WorkoutSession[] {
  const all = getFromStorage<WorkoutSession[]>(STORAGE_KEYS.WORKOUTS, []);
  if (userId) return all.filter((w) => w.userId === userId);
  return all;
}

export function saveWorkout(workout: WorkoutSession): void {
  const workouts = getWorkouts();
  workouts.push(workout);
  setToStorage(STORAGE_KEYS.WORKOUTS, workouts);
}

// Leaderboard
export function getLeaderboard(friendsOnly: boolean = false, currentUserId?: string): LeaderboardEntry[] {
  const users = getAllUsers();
  const workouts = getWorkouts();
  const currentUser = currentUserId ? getUserById(currentUserId) : null;

  const entries: LeaderboardEntry[] = users
    .filter((user) => {
      if (!friendsOnly || !currentUser) return true;
      return user.id === currentUserId || currentUser.friends.includes(user.id);
    })
    .map((user) => {
      const userWorkouts = workouts.filter((w) => w.userId === user.id);
      const totalPushups = userWorkouts.reduce((sum, w) => sum + w.count, 0);
      const bestSession = userWorkouts.reduce((max, w) => Math.max(max, w.count), 0);
      const averageForm =
        userWorkouts.length > 0
          ? userWorkouts.reduce((sum, w) => sum + w.averageFormScore, 0) / userWorkouts.length
          : 0;

      // Calculate streak
      const dates = Array.from(new Set(userWorkouts.map((w) => w.date.split("T")[0]))).sort().reverse();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split("T")[0];
        if (dates[i] === expectedStr) {
          streak++;
        } else {
          break;
        }
      }

      return {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        totalPushups,
        bestSession,
        averageForm: Math.round(averageForm),
        workoutCount: userWorkouts.length,
        streak,
      };
    });

  return entries.sort((a, b) => b.totalPushups - a.totalPushups);
}

// Friends
export function addFriend(userId: string, friendId: string): void {
  const user = getUserById(userId);
  const friend = getUserById(friendId);
  if (!user || !friend) return;

  if (!user.friends.includes(friendId)) {
    user.friends.push(friendId);
    setCurrentUser(user);
  }
  if (!friend.friends.includes(userId)) {
    friend.friends.push(userId);
    const users = getAllUsers();
    const idx = users.findIndex((u) => u.id === friendId);
    if (idx >= 0) {
      users[idx] = friend;
      setToStorage(STORAGE_KEYS.USERS, users);
    }
  }
}

// Seed demo data
export function seedDemoData(): void {
  const existing = getAllUsers();
  if (existing.length > 1) return; // Already seeded

  const demoUsers: User[] = [
    { id: "demo-1", username: "fitfiona", displayName: "Fiona Chen", avatarColor: "#ec4899", createdAt: "2025-01-15", friends: ["demo-2", "demo-3"] },
    { id: "demo-2", username: "pushupping", displayName: "Mike Rodriguez", avatarColor: "#8b5cf6", createdAt: "2025-02-01", friends: ["demo-1", "demo-4"] },
    { id: "demo-3", username: "ironarms", displayName: "Sarah Kim", avatarColor: "#06b6d4", createdAt: "2025-01-20", friends: ["demo-1", "demo-5"] },
    { id: "demo-4", username: "repcounter", displayName: "Jake Thompson", avatarColor: "#f97316", createdAt: "2025-03-01", friends: ["demo-2"] },
    { id: "demo-5", username: "dailyreps", displayName: "Aisha Patel", avatarColor: "#10b981", createdAt: "2025-02-15", friends: ["demo-3"] },
  ];

  const demoWorkouts: WorkoutSession[] = [];
  const now = new Date();

  demoUsers.forEach((user) => {
    const sessionCount = 5 + Math.floor(Math.random() * 20);
    for (let i = 0; i < sessionCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const count = 10 + Math.floor(Math.random() * 50);
      const duration = count * (2 + Math.random() * 2);
      demoWorkouts.push({
        id: `demo-workout-${user.id}-${i}`,
        userId: user.id,
        count,
        duration: Math.round(duration),
        averageFormScore: 60 + Math.floor(Math.random() * 35),
        timestamps: Array.from({ length: count }, (_, j) => j * 2000 + Math.random() * 500),
        date: date.toISOString(),
        verified: true,
      });
    }
  });

  const users = getAllUsers();
  const allUsers = [...users, ...demoUsers.filter((d) => !users.find((u) => u.id === d.id))];
  setToStorage(STORAGE_KEYS.USERS, allUsers);

  const workouts = getWorkouts();
  const allWorkouts = [...workouts, ...demoWorkouts];
  setToStorage(STORAGE_KEYS.WORKOUTS, allWorkouts);
}
