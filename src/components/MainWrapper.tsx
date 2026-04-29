"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Blog pages have their own footer and don't need the bottom-nav clearance
  const isBlog = pathname?.startsWith("/blog");

  return (
    <main
      className="min-h-screen"
      style={
        isBlog
          ? undefined
          : {
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
            }
      }
    >
      {children}
    </main>
  );
}
