export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  createdAt: string;
  friends: string[]; // user IDs
}

export interface WorkoutSession {
  id: string;
  userId: string;
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
  totalPushups: number;
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

export interface PushupState {
  phase: "up" | "down" | "transition";
  count: number;
  formScore: number;
  feedback: string;
  elbowAngle: number;
  bodyAlignment: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}
