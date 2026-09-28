"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * The way into the panel from the site itself, so staff do not have to remember the /admin address.
 * A quiet link in the footer for everyone; for someone already signed in it turns into a marked
 * "Admin panel" button. The check runs in the browser only, so the page stays cached for everyone
 * else and nothing about the visitor reaches the server.
 */
export default function StaffEntry({ label, panel }: { label: string; panel: string }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let live = true;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (live) setSignedIn(!!data.session);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return signedIn ? (
    <Link
      href="/admin"
      className="press inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold text-white transition-colors hover:bg-white/20"
    >
      <span aria-hidden>⚙</span> {panel}
    </Link>
  ) : (
    <Link href="/admin/login" className="transition-colors hover:text-white">
      {label}
    </Link>
  );
}
