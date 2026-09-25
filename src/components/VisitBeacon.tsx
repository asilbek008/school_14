"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** A random id kept in the browser's storage; nothing that identifies the person. */
function storedId(storage: Storage, key: string) {
  let id = storage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(key, id);
  }
  return id;
}

/**
 * Counts a page view for the admin's "Tashriflar" page: the path, an anonymous browser id and visit id,
 * and — on the first page of a visit — the site the visitor came from. Skipped when the browser asks
 * not to be tracked and in a browser the admin panel was opened in. Renders nothing.
 */
export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
      // Not counted: browsers asking not to be tracked, and the admin's own (marked by ExcludeDevice).
      if (nav.doNotTrack === "1" || nav.globalPrivacyControl || localStorage.getItem("noTrack")) return;
      const firstPage = !sessionStorage.getItem("sid");
      const session = storedId(sessionStorage, "sid");
      const visitor = storedId(localStorage, "vid");
      let referrer: string | null = null;
      if (firstPage && document.referrer) {
        const host = new URL(document.referrer).hostname.replace(/^www\./, "");
        if (host !== location.hostname) referrer = host;
      }
      const body = JSON.stringify({ path: pathname, visitor, session, referrer });
      if (!navigator.sendBeacon?.("/api/visit", new Blob([body], { type: "application/json" }))) {
        fetch("/api/visit", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
      }
    } catch {
      // Storage blocked (private mode) or no crypto: the view is simply not counted.
    }
  }, [pathname]);

  return null;
}
