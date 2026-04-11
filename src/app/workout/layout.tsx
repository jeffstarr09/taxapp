import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Pushup Counter — Count Reps With Your Phone Camera",
  description:
    "Start a workout with DROP's free AI pushup counter. Uses your phone camera to count reps in real time, checks your form, and saves every session to your history.",
  alternates: {
    canonical: "https://dropfit.app/workout",
  },
  openGraph: {
    title: "AI Pushup Counter — Count Reps With Your Phone Camera",
    description:
      "Free AI pushup counter that uses your phone camera to count reps and check your form in real time.",
    url: "https://dropfit.app/workout",
  },
};

export default function WorkoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
