import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "Pushup Training Blog",
    template: "%s | DROP Blog",
  },
  description:
    "Pushup form guides, training plans, and fitness tips from DROP. Learn how to get stronger with bodyweight training.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Blog-specific top header — distinct from the app's bottom nav */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-gray-900">
              DR<span className="text-[#e8450a]">O</span>P
            </span>
            <span className="text-gray-400 text-sm font-medium">/ Blog</span>
          </Link>
          <Link
            href="/workout"
            className="px-4 py-2 bg-[#e8450a] text-white rounded-lg text-xs font-bold hover:bg-[#d03e09] transition"
          >
            Try the App
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-5 py-8 text-center">
          <p className="text-gray-500 text-sm mb-3">
            Ready to count your pushups automatically?
          </p>
          <Link
            href="/workout"
            className="inline-block px-6 py-3 bg-[#e8450a] text-white rounded-xl font-bold text-sm hover:bg-[#d03e09] transition"
          >
            Start a Workout
          </Link>
          <p className="text-gray-300 text-xs mt-6">
            &copy; {new Date().getFullYear()} DROP. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
