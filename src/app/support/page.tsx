import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://dropfit.app";
const SUPPORT_EMAIL = "support@dropfit.app";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with DROP. Contact our support team by email for questions, bug reports, account issues, or feedback.",
  alternates: {
    canonical: `${SITE_URL}/support`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-gray-400 text-sm mb-6 hover:text-[#e8450a] transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to DROP
      </Link>

      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
          Support
        </h1>
        <p className="text-gray-500 text-base">
          Need help with DROP? We&rsquo;re here to make it right.
        </p>
      </header>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Contact us</h2>
          <p className="mb-4">
            The fastest way to reach us is by email. Send your question, bug report, or feedback to:
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-block text-xl font-bold text-[#e8450a] underline"
          >
            {SUPPORT_EMAIL}
          </a>
          <p className="mt-4 text-sm text-gray-500">
            We read every message and aim to respond within a couple of business days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">What to include</h2>
          <p className="mb-3">
            To help us help you faster, please include as much of the following as you can:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>The email address or username on your DROP account.</li>
            <li>Your device and browser (for example, &ldquo;iPhone 15, Safari&rdquo;).</li>
            <li>A description of what happened and what you expected to happen.</li>
            <li>A screenshot or short screen recording, if relevant.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Common topics</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Reps not counting or counting incorrectly</li>
            <li>Camera or pose detection issues</li>
            <li>Workouts not saving to your profile</li>
            <li>Account, sign-in, or password reset help</li>
            <li>Account or data deletion requests</li>
            <li>Feature ideas and feedback</li>
          </ul>
        </section>

        <section className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            See also:{" "}
            <Link href="/privacy" className="text-[#e8450a] underline">
              Privacy Policy
            </Link>{" "}
            ·{" "}
            <Link href="/terms" className="text-[#e8450a] underline">
              Terms of Service
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
