import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://dropfit.app";
const CONTACT_EMAIL = "hello@dropfit.app";
const LAST_UPDATED = "April 11, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How DROP collects, uses, and protects your personal information. Read our privacy policy covering data collection, storage, and third-party services.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <p>
            DROP (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website{" "}
            <a href={SITE_URL} className="text-[#e8450a] underline">
              dropfit.app
            </a>{" "}
            (the &ldquo;Service&rdquo;), an AI-powered pushup counter and workout tracker. This
            Privacy Policy explains what information we collect, how we use it, and the choices
            you have. By using DROP, you agree to the practices described here.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Information We Collect</h2>
          <p className="mb-3">When you create an account or use DROP, we collect:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Account information:</strong> email address, username, display name, and
              password (stored as a salted hash — we never see your plaintext password).
            </li>
            <li>
              <strong>Profile information:</strong> optional avatar photo and an accent color.
              Avatar photos you upload are resized in your browser and stored as part of your
              profile.
            </li>
            <li>
              <strong>Google account data (if you sign in with Google):</strong> your name, email
              address, and profile picture from your Google account. We use this only to create
              and populate your DROP profile.
            </li>
            <li>
              <strong>Workout data:</strong> pushup counts, session duration, form scores, and
              timestamps generated while you use the camera-based counter.
            </li>
            <li>
              <strong>Analytics events:</strong> basic usage events (for example, &ldquo;workout
              started,&rdquo; &ldquo;user signed up&rdquo;) used to improve the product.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Camera and Pose Detection</h2>
          <p>
            DROP uses your device&rsquo;s camera and on-device AI (TensorFlow.js MoveNet) to count
            pushups in real time. <strong>Video from your camera never leaves your device.</strong>{" "}
            Pose detection runs entirely in your browser. We only store the resulting numeric
            workout data (rep count, duration, form score) — not video or images of your workouts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To create and authenticate your account.</li>
            <li>To display your workouts, stats, and position on leaderboards.</li>
            <li>To enable friend connections and social features.</li>
            <li>To diagnose bugs and improve the product.</li>
            <li>To communicate important account notices (for example, password resets).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Public Information</h2>
          <p>
            Your username, display name, avatar, and aggregate workout stats are visible on the
            public leaderboard and to other users. Do not upload an avatar or choose a display
            name that contains information you do not want to be public.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Third-Party Services</h2>
          <p className="mb-3">
            We rely on a small number of reputable third parties to run DROP. Each processes data
            only to provide its specific service:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Supabase</strong> — database, authentication, and storage.{" "}
              <a
                href="https://supabase.com/privacy"
                className="text-[#e8450a] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase privacy policy
              </a>
              .
            </li>
            <li>
              <strong>Vercel</strong> — hosting and content delivery.{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                className="text-[#e8450a] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vercel privacy policy
              </a>
              .
            </li>
            <li>
              <strong>Google</strong> — optional OAuth sign-in.{" "}
              <a
                href="https://policies.google.com/privacy"
                className="text-[#e8450a] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google privacy policy
              </a>
              .
            </li>
          </ul>
          <p className="mt-3">
            We do not sell your personal information and we do not share it with advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Cookies and Local Storage</h2>
          <p>
            DROP uses cookies and your browser&rsquo;s local storage to keep you signed in and to
            remember lightweight preferences. We do not use third-party advertising or tracking
            cookies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Data Retention</h2>
          <p>
            We keep your account and workout data for as long as your account is active. If you
            delete your account, we remove your profile and associated workouts from our database.
            Contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#e8450a] underline">
              {CONTACT_EMAIL}
            </a>{" "}
            to request deletion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Your Rights</h2>
          <p>
            Depending on where you live, you may have the right to access, correct, or delete the
            personal information we hold about you, or to object to or restrict certain
            processing. To exercise any of these rights, email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#e8450a] underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Children&rsquo;s Privacy</h2>
          <p>
            DROP is not directed at children under 13, and we do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with
            personal information, please contact us and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Security</h2>
          <p>
            We use industry-standard measures to protect your information, including encryption in
            transit (HTTPS) and row-level security on our database. No system is perfectly secure,
            however, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we&rsquo;ll revise
            the &ldquo;Last updated&rdquo; date at the top of the page. Material changes will be
            communicated through the app or by email.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Contact</h2>
          <p>
            Questions or requests? Email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#e8450a] underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            See also:{" "}
            <Link href="/terms" className="text-[#e8450a] underline">
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
