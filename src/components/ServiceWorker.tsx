"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on every visit. It used to be registered only when someone turned on
 * notifications, so the offline cache never existed for anyone else — and an installed app with no cache
 * opens a browser error page the moment the connection drops.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // A refused registration (private window, blocked storage) must not break the page.
      });
    };
    // After load, so it never competes with the first paint.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
