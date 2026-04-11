import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In or Create an Account",
  description:
    "Sign in to DROP to save your workouts, compete on leaderboards, and track your progress. Sign up free with email or Google in seconds.",
  alternates: {
    canonical: "https://dropfit.app/auth",
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
