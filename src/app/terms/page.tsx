import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://dropfit.app";
const CONTACT_EMAIL = "hello@dropfit.app";
const LAST_UPDATED = "April 11, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms you agree to when using DROP, the AI-powered pushup counter. Covers acceptable use, accounts, disclaimers, and liability.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <p>
            Welcome to DROP. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to
            and use of <a href={SITE_URL} className="text-[#e8450a] underline">dropfit.app</a>{" "}
            and related services (collectively, the &ldquo;Service&rdquo;). By creating an account
            or using the Service, you agree to these Terms. If you do not agree, do not use DROP.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">1. Eligibility</h2>
          <p>
            You must be at least 13 years old to use DROP. By using the Service, you represent
            that you meet this requirement and that you have the right to agree to these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">2. Your Account</h2>
          <p className="mb-3">
            To use most features, you need an account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Provide accurate information when you sign up.</li>
            <li>Keep your password secure and not share it with anyone.</li>
            <li>Be responsible for all activity under your account.</li>
            <li>Notify us immediately if you suspect unauthorized access.</li>
          </ul>
          <p className="mt-3">
            We may suspend or terminate your account if you violate these Terms or misuse the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">3. Acceptable Use</h2>
          <p className="mb-3">When using DROP, you agree not to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Attempt to manipulate leaderboards, inflate your counts, or otherwise cheat.
            </li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>
              Upload avatars or choose usernames that are obscene, hateful, discriminatory, or
              infringe someone else&rsquo;s rights.
            </li>
            <li>
              Reverse engineer, scrape, or otherwise attempt to extract source code or data from
              the Service beyond what is publicly exposed.
            </li>
            <li>
              Disrupt or interfere with the Service, including attempting to bypass rate limits
              or security measures.
            </li>
            <li>Use DROP for any unlawful purpose.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">4. User Content</h2>
          <p>
            &ldquo;User Content&rdquo; means anything you upload or post, including display name,
            username, and avatar photo. You retain ownership of your User Content. By uploading
            it, you grant DROP a worldwide, non-exclusive, royalty-free license to host, display,
            and use that content solely to operate and improve the Service (for example, showing
            your avatar on the leaderboard). You are responsible for your User Content and you
            warrant you have the right to share it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">5. AI Rep Counting &mdash; No Guarantees</h2>
          <p>
            DROP uses machine learning to count pushups and evaluate form based on your camera
            feed. These results are estimates and may be wrong. We do not guarantee that reps
            will be counted perfectly or that form scores accurately reflect exercise quality.
            You should not rely on DROP for medical, coaching, or competitive decisions where
            exact accuracy is required.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">6. Health and Safety Disclaimer</h2>
          <p>
            DROP is a fitness tracking tool, not medical advice. Exercise always carries some
            risk of injury. Consult a physician before beginning any new exercise program,
            especially if you have pre-existing health conditions. Stop immediately if you feel
            pain, dizziness, or shortness of breath. You use DROP and perform exercises at your
            own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">7. Privacy</h2>
          <p>
            Your use of DROP is also governed by our{" "}
            <Link href="/privacy" className="text-[#e8450a] underline">
              Privacy Policy
            </Link>
            , which explains what data we collect and how we use it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">8. Intellectual Property</h2>
          <p>
            The DROP name, logo, app design, code, and content (excluding User Content) are owned
            by DROP or its licensors and protected by copyright, trademark, and other laws. You
            may not copy, modify, distribute, or create derivative works from any part of the
            Service without our prior written permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">9. Third-Party Services</h2>
          <p>
            DROP integrates with third-party services including Supabase (database and auth),
            Vercel (hosting), and Google (OAuth sign-in). Your use of those services is subject
            to their own terms and privacy policies. DROP is not responsible for third-party
            services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">10. Service Availability</h2>
          <p>
            We provide DROP on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do
            not guarantee that the Service will always be available, uninterrupted, error-free,
            or secure. We may modify, suspend, or discontinue any part of the Service at any
            time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">11. Disclaimers</h2>
          <p className="uppercase text-sm">
            To the fullest extent permitted by law, DROP disclaims all warranties, express or
            implied, including warranties of merchantability, fitness for a particular purpose,
            non-infringement, and any warranties arising out of course of dealing or usage of
            trade. We do not warrant that the Service will meet your requirements or expectations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">12. Limitation of Liability</h2>
          <p className="uppercase text-sm">
            To the fullest extent permitted by law, in no event will DROP, its affiliates, or its
            contributors be liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits, revenues, data, or goodwill arising out of
            or related to your use of the Service. Our total liability for any claim relating to
            the Service will not exceed one hundred US dollars ($100) or the amount you paid us
            in the past twelve months, whichever is greater.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">13. Indemnification</h2>
          <p>
            You agree to indemnify and hold DROP harmless from any claims, damages, or expenses
            (including reasonable attorneys&rsquo; fees) arising from your use of the Service,
            your User Content, or your violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">14. Termination</h2>
          <p>
            You may stop using DROP at any time. We may suspend or terminate your access if we
            believe you have violated these Terms or to protect the Service and its users. Upon
            termination, your right to use DROP ceases, though provisions that by their nature
            should survive (such as intellectual property, disclaimers, and liability limits)
            will continue to apply.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">15. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we&rsquo;ll
            update the &ldquo;Last updated&rdquo; date at the top and, where appropriate, notify
            you through the Service. Your continued use after changes take effect constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">16. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the United States and the state in which
            DROP is operated, without regard to conflict-of-law principles. Any disputes will be
            resolved in the courts located in that jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-3">17. Contact</h2>
          <p>
            Questions about these Terms? Email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#e8450a] underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            See also:{" "}
            <Link href="/privacy" className="text-[#e8450a] underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
