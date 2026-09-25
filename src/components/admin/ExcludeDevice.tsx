"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { forgetAdminDevice } from "@/app/admin/(panel)/visits/actions";

/**
 * Marks the browser the admin panel is open in, so the public site stops counting its page views
 * (VisitBeacon reads `noTrack`), and removes the views it was counted for before. Once per visit.
 */
export default function ExcludeDevice() {
  const router = useRouter();
  useEffect(() => {
    try {
      localStorage.setItem("noTrack", "1");
      if (sessionStorage.getItem("noTrackDone")) return;
      sessionStorage.setItem("noTrackDone", "1");
      const visitor = localStorage.getItem("vid");
      // Refresh so a statistics page already on screen no longer shows them.
      if (visitor) forgetAdminDevice(visitor).then(() => router.refresh(), () => {});
    } catch {
      // Storage blocked: nothing to mark.
    }
  }, [router]);
  return null;
}
