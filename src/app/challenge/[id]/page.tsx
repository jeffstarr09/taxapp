"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getChallenge, Challenge1v1 } from "@/lib/challenges-1v1";
import { getExerciseConfig } from "@/lib/exercise-config";

export default function ChallengePage() {
  const params = useParams();
  const id = params.id as string;
  const { profile } = useAuth();
  const [challenge, setChallenge] = useState<Challenge1v1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const c = getChallenge(id);
    if (c) {
      setChallenge(c);
      setExpired(new Date(c.expiresAt) < new Date());
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#e8450a] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <div className="drop-card p-8">
          <h2 className="text-xl font-black text-gray-900 mb-2">Challenge Not Found</h2>
          <p className="text-gray-400 text-sm mb-6">This challenge link may have expired or is invalid.</p>
          <Link href="/" className="inline-block px-8 py-3 bg-[#e8450a] text-white rounded-xl font-bold text-sm">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const config = getExerciseConfig(challenge.exerciseType);
  const hoursLeft = Math.max(0, Math.round((new Date(challenge.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="max-w-lg mx-auto px-5 py-12 text-center">
      <div className="drop-card p-8">
        {/* Challenge icon */}
        <div className="w-20 h-20 rounded-2xl bg-[#e8450a]/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-[#e8450a]" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1">You&apos;ve Been Challenged!</h1>
        <p className="text-gray-400 text-sm mb-6">
          {challenge.creatorName} challenged you to do <span className="text-[#e8450a] font-bold">{challenge.targetReps} {config.labelPlural.toLowerCase()}</span>
        </p>

        {expired ? (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-gray-400 text-sm font-medium">This challenge has expired</p>
          </div>
        ) : (
          <div className="bg-[#e8450a]/5 rounded-xl p-4 mb-6">
            <p className="text-[#e8450a] font-bold text-lg">{hoursLeft}h left</p>
            <p className="text-gray-400 text-xs">to complete this challenge</p>
          </div>
        )}

        <div className="space-y-3 text-left mb-6">
          <div className="flex items-center gap-3 text-sm">
            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">{config.icon}</span>
            <span className="text-gray-700"><span className="font-bold">{challenge.targetReps}</span> {config.labelPlural}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </span>
            <span className="text-gray-700">24 hours to complete</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </span>
            <span className="text-gray-700">AI-verified reps</span>
          </div>
        </div>

        {!expired && (
          profile ? (
            <Link
              href={`/workout?exercise=${challenge.exerciseType}`}
              className="block w-full py-3.5 bg-[#e8450a] text-white rounded-xl font-bold text-sm text-center"
            >
              Accept Challenge
            </Link>
          ) : (
            <Link
              href="/auth"
              className="block w-full py-3.5 bg-[#e8450a] text-white rounded-xl font-bold text-sm text-center"
            >
              Sign Up to Accept
            </Link>
          )
        )}
      </div>
    </div>
  );
}
