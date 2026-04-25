"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      const msg = errorDescription || errorParam;
      router.replace(`/auth?error=${encodeURIComponent(msg)}`);
      return;
    }

    if (!code) {
      router.replace(`/auth?error=${encodeURIComponent("Missing OAuth code")}`);
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }: { error: AuthError | null }) => {
      if (error) {
        router.replace(`/auth?error=${encodeURIComponent(error.message)}`);
      } else {
        router.replace("/");
      }
    });
  }, [router, searchParams]);

  return (
    <div className="max-w-lg mx-auto px-5 py-20 text-center">
      <div className="w-8 h-8 border-2 border-[#e8450a] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-gray-400 text-sm mt-4">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-5 py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#e8450a] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
