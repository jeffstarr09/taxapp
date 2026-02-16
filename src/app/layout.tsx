import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "DROP — AI Push-up Counter",
  description:
    "Drop. Push. Prove. AI-verified push-ups with real-time form tracking. Challenge your friends and climb the leaderboard.",
  keywords: [
    "push-up counter",
    "pushup tracker",
    "AI fitness",
    "workout tracker",
    "push-up form checker",
    "exercise counter",
    "fitness app",
    "bodyweight workout",
  ],
  authors: [{ name: "DROP" }],
  creator: "DROP",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    title: "DROP — AI Push-up Counter",
    description:
      "AI-powered push-up counter that verifies every rep. Real-time form tracking, leaderboards, and challenges.",
    siteName: "DROP",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DROP — AI Push-up Counter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DROP — AI Push-up Counter",
    description:
      "AI-powered push-up counter that verifies every rep. Real-time form tracking, leaderboards, and challenges.",
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
      <body className="font-sans antialiased noise-bg">
        <Navbar />
        <main className="pt-4 pb-24 md:pt-20 md:pb-4 min-h-screen relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
