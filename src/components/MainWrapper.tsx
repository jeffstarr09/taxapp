"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Blog pages have their own footer and don't need the bottom-nav clearance
  const isBlog = pathname?.startsWith("/blog");

  return (
    <main className={`${isBlog ? "" : "pb-20"} min-h-screen`}>
      {children}
    </main>
  );
}
