export type ExerciseType = "pushup" | "pullup" | "squat" | "situp";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarUrl: string | null;
  createdAt: string;
  friends: string[]; // user IDs
}

export interface WorkoutSession {
  id: string;
  userId: string;
  exerciseType: ExerciseType;
  count: number;
  duration: number; // seconds
  averageFormScore: number; // 0-100
  timestamps: number[]; // ms timestamps for each rep
  date: string; // ISO date
  verified: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarUrl: string | null;
  totalReps: number;
  bestSession: number;
  averageForm: number;
  workoutCount: number;
  streak: number; // consecutive days
}

export interface PoseKeypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface ExerciseState {
  phase: "up" | "down" | "transition";
  count: number;
  formScore: number;
  feedback: string;
  elbowAngle: number;
  bodyAlignment: number;
}

/** @deprecated Use ExerciseState instead */
export type PushupState = ExerciseState;

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarUrl: string | null;
  exerciseType: ExerciseType;
  count: number;
  date: string;
}
