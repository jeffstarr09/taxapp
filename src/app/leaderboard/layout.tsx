import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pushup Leaderboard — Compete With Friends Worldwide",
  description:
    "See who's dropping the most pushups. Global and friends-only leaderboards with daily challenges. Add friends, compete, and climb the ranks on DROP.",
  alternates: {
    canonical: "https://dropfit.app/leaderboard",
  },
  openGraph: {
    title: "Pushup Leaderboard — Compete With Friends Worldwide",
    description:
      "Global and friends-only pushup leaderboards. Compete, climb the ranks, and crush daily challenges.",
    url: "https://dropfit.app/leaderboard",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
