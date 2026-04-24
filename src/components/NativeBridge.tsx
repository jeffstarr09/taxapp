"use client";

import { useEffect } from "react";
import { initNativeBridge } from "@/lib/native-bridge";

export default function NativeBridge() {
  useEffect(() => {
    initNativeBridge();
  }, []);

  return null;
}
