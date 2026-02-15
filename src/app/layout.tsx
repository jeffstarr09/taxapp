import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DROP — AI Push-up Counter",
  description: "Drop. Push. Prove. AI-verified push-ups with real-time form tracking. Challenge your friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased noise-bg">
        <Navbar />
        <main className="pt-4 pb-24 md:pt-20 md:pb-4 min-h-screen relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
