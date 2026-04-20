import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MainWrapper from "@/components/MainWrapper";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { AuthProvider } from "@/lib/auth-context";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import InstallPrompt from "@/components/InstallPrompt";
import PrivateBrowsingBanner from "@/components/PrivateBrowsingBanner";

const SITE_URL = "https://dropfit.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f7f7",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DROP — AI Pushup Counter & Workout Tracker",
    template: "%s | DROP",
  },
  description:
    "DROP is the AI-powered pushup counter that verifies every rep with real-time form tracking. Count pushups automatically, compete on leaderboards, and crush daily challenges.",
  keywords: [
    "pushup counter",
    "push-up counter app",
    "AI pushup tracker",
    "workout counter",
    "pushup form checker",
    "exercise tracker",
    "bodyweight workout app",
    "fitness challenge app",
    "pushup leaderboard",
    "free pushup counter",
  ],
  authors: [{ name: "DROP" }],
  creator: "DROP",
  manifest: "/manifest.json",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "DROP — AI Pushup Counter & Workout Tracker",
    description:
      "AI-powered pushup counter that verifies every rep. Real-time form tracking, leaderboards, and daily challenges. Free to try.",
    siteName: "DROP",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DROP — AI Pushup Counter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DROP — AI Pushup Counter & Workout Tracker",
    description:
      "AI-powered pushup counter that verifies every rep. Real-time form tracking, leaderboards, and daily challenges.",
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DROP",
  alternateName: "DROP Pushup Counter",
  description:
    "AI-powered pushup counter that verifies every rep with real-time form tracking. Count pushups automatically, compete on leaderboards, and crush daily challenges.",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web, iOS, Android",
  url: SITE_URL,
  image: `${SITE_URL}/og-image.png`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI-powered rep counting",
    "Real-time form tracking",
    "Global leaderboards",
    "Daily challenges",
    "Friend competitions",
    "Workout history",
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-[#f7f7f7] text-neutral-900">
        <AuthProvider>
          <AnalyticsProvider>
            <PrivateBrowsingBanner />
            <MainWrapper>{children}</MainWrapper>
            <Navbar />
            <InstallPrompt />
            <ServiceWorkerRegistrar />
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
