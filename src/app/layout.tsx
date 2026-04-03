import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { AuthProvider } from "@/lib/auth-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f7f7",
};

export const metadata: Metadata = {
  title: "DROP — AI Workout Counter",
  description:
    "Drop. Push. Prove. AI-verified workouts with real-time form tracking. Challenge your friends and climb the leaderboard.",
  keywords: [
    "push-up counter",
    "pushup tracker",
    "AI fitness",
    "workout tracker",
    "exercise form checker",
    "exercise counter",
    "fitness app",
    "bodyweight workout",
    "pull-up counter",
    "squat tracker",
  ],
  authors: [{ name: "DROP" }],
  creator: "DROP",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    title: "DROP — AI Workout Counter",
    description:
      "AI-powered workout counter that verifies every rep. Real-time form tracking, leaderboards, and challenges.",
    siteName: "DROP",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DROP — AI Workout Counter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DROP — AI Workout Counter",
    description:
      "AI-powered workout counter that verifies every rep. Real-time form tracking, leaderboards, and challenges.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DROP",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="font-sans antialiased bg-[#f7f7f7] text-neutral-900">
        <AuthProvider>
          <AnalyticsProvider>
            <main className="pb-20 min-h-screen">
              {children}
            </main>
            <Navbar />
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
