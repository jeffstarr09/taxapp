"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // The Supabase client automatically handles the OAuth code/hash exchange
    // when it detects the tokens in the URL on page load.
    // We just need to wait for the session to be established then redirect.
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) {
        router.replace("/");
      } else {
        // Listen for the auth state change (token exchange may still be in progress)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
          if (event === "SIGNED_IN") {
            subscription.unsubscribe();
            router.replace("/");
          }
        });

        // Timeout fallback — redirect to auth page if nothing happens
        setTimeout(() => {
          subscription.unsubscribe();
          router.replace("/auth");
        }, 5000);
      }
    });
  }, [router]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-[#e8450a] rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-400 text-sm">Signing you in...</p>
    </div>
  );
}
