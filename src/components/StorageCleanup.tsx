"use client";

import { useEffect } from "react";
import { cleanupBloatedEntries } from "@/lib/game-store";

export default function StorageCleanup() {
  useEffect(() => {
    cleanupBloatedEntries();
  }, []);

  return null;
}
