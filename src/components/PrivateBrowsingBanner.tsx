"use client";

import { useEffect, useState } from "react";
import { isPrivateBrowsing } from "@/lib/private-browsing";

const DISMISS_KEY = "drop_private_banner_dismissed";

export default function PrivateBrowsingBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    isPrivateBrowsing().then((isPrivate) => {
      if (isPrivate) setShow(true);
    });
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-amber-800 text-sm font-semibold">Private / Incognito Mode</p>
          <p className="text-amber-700 text-xs mt-0.5">
            Workouts may not save properly. Open DROP in a regular browser window for the best experience.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-400 hover:text-amber-600 shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
