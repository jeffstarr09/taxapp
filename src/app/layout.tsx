import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PushUp Pro — AI-Verified Push-up Counter",
  description: "Count your push-ups with AI-powered pose detection. Compete with friends on the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Navbar />
        <main className="pt-4 pb-20 md:pt-20 md:pb-4 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
