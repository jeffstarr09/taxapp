import Link from "next/link";

/**
 * Small footer linking to Privacy Policy and Terms of Service.
 * Used on the homepage and profile page so the links are reachable
 * from within the app (a requirement for Google OAuth verification).
 */
export default function LegalFooter() {
  return (
    <footer className="mt-10 mb-4 text-center">
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <Link href="/privacy" className="hover:text-[#e8450a] transition">
          Privacy
        </Link>
        <span className="text-gray-200">·</span>
        <Link href="/terms" className="hover:text-[#e8450a] transition">
          Terms
        </Link>
        <span className="text-gray-200">·</span>
        <Link href="/blog" className="hover:text-[#e8450a] transition">
          Blog
        </Link>
      </div>
      <p className="text-[10px] text-gray-300 mt-2">
        &copy; {new Date().getFullYear()} DROP
      </p>
    </footer>
  );
}
