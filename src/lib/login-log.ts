import "server-only";
import { headers } from "next/headers";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** "Chrome · Android (telefon)" from a User-Agent string — enough to tell one's own devices apart. */
export function describeDevice(ua: string): string | null {
  if (!ua) return null;
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Linux/.test(ua)
              ? "Linux"
              : null;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /YaBrowser/.test(ua)
        ? "Yandex"
        : /SamsungBrowser/.test(ua)
          ? "Samsung"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : /Chrome\//.test(ua)
              ? "Chrome"
              : /Safari\//.test(ua)
                ? "Safari"
                : null;
  const kind = /iPad|Tablet/.test(ua) ? "planshet" : /Mobi|Android|iPhone/.test(ua) ? "telefon" : "kompyuter";
  return [browser, os].filter(Boolean).join(" · ") + ` (${kind})`;
}

/** Where the request came from: Vercel's edge adds the visitor's IP and approximate place. */
export async function requestOrigin() {
  const h = await headers();
  const decode = (v: string | null) => {
    if (!v) return null;
    try {
      return decodeURIComponent(v).slice(0, 100);
    } catch {
      return v.slice(0, 100);
    }
  };
  const ua = (h.get("user-agent") ?? "").slice(0, 500);
  return {
    ip: (h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null)?.slice(0, 64) ?? null,
    city: decode(h.get("x-vercel-ip-city")),
    region: decode(h.get("x-vercel-ip-country-region")),
    country: h.get("x-vercel-ip-country")?.slice(0, 2) ?? null,
    user_agent: ua || null,
    device: describeDevice(ua),
  };
}

/**
 * Records a sign-in, failed attempt or sign-out. A successful sign-in or sign-out must be written with
 * the admin's own session (the insert policy checks it). Never throws: the log must not block a sign-in.
 */
export async function logAdminLogin(
  supabase: Supabase,
  entry: { event: "login" | "logout"; userId: string; email: string } | { event: "failed"; email: string; reason: string },
) {
  try {
    const row = {
      ...(await requestOrigin()),
      event: entry.event,
      email: entry.email.slice(0, 320) || null,
      user_id: entry.event === "failed" ? null : entry.userId,
      reason: entry.event === "failed" ? entry.reason.slice(0, 60) : null,
    };
    const { error } = await supabase.from("admin_logins").insert(row);
    if (error && !error.message.includes("rate_limited")) console.error(`[login-log] ${error.code ?? "unknown"}`);
  } catch {
    // Logging is best effort.
  }
}
