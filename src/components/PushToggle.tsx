"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type T = Dictionary["push"];
type State = "loading" | "none" | "unsupported" | "ios" | "denied" | "off" | "on" | "busy" | "error";

function keyBytes(base64: string) {
  const raw = atob((base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** The site's VAPID public key (set up in the admin panel); null — push is not set up yet. */
let keyPromise: Promise<string | null> | null = null;
const publicKey = () =>
  (keyPromise ??= Promise.resolve(createClient().rpc("push_public_key")).then(
    ({ data }) => (typeof data === "string" && data ? data : null),
    () => null,
  ));

/** What this browser can do right now (read once on mount — the page itself is cached and the same for everyone). */
async function detect(): Promise<State> {
  if (!(await publicKey())) return "none";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return ios && !standalone ? "ios" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ? "on" : "off";
}

/**
 * "Bildirishnoma olish": subscribes this browser to web push for new news (in the page's language). Nothing about the
 * visitor is stored — only the push endpoint the browser gives. `card` — on the news page, `footer` — a small button.
 */
export default function PushToggle({ t, lang, variant = "card" }: { t: T; lang: Locale; variant?: "card" | "footer" }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    detect().then(setState, () => setState("unsupported"));
  }, []);

  async function turnOn() {
    setState("busy");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("denied");
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      const key = await publicKey();
      if (!key) return setState("error");
      const sub =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
      const json = sub.toJSON();
      const { error } = await createClient().rpc("push_subscribe", {
        p_endpoint: sub.endpoint,
        p_p256dh: json.keys?.p256dh ?? "",
        p_auth: json.keys?.auth ?? "",
        p_lang: lang,
      });
      if (error) {
        await sub.unsubscribe();
        return setState("error");
      }
      setState("on");
    } catch {
      setState("error");
    }
  }

  async function turnOff() {
    setState("busy");
    try {
      const sub = await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription();
      if (sub) {
        await createClient().rpc("push_unsubscribe", { p_endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("error");
    }
  }

  // Not set up yet (no VAPID key) — nothing to offer.
  if (state === "none") return null;

  const note = state === "denied" ? t.denied : state === "ios" ? t.ios : state === "error" ? t.error : state === "unsupported" ? t.unsupported : null;

  if (variant === "footer") {
    if (state === "loading" || state === "unsupported") return null;
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={state === "on" ? turnOff : turnOn}
          disabled={state === "busy" || state === "denied" || state === "ios"}
          title={note ?? undefined}
          className="press inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
        >
          <span aria-hidden>🔔</span>
          {state === "on" ? t.on : state === "busy" ? t.busy : t.turnOn}
        </button>
        {(state === "ios" || state === "denied") && <p className="mt-2 max-w-xs text-[12px] leading-snug text-[#8b96b8]">{note}</p>}
      </div>
    );
  }

  return (
    <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-brand/20 bg-brand-soft/60 p-5 sm:flex-row sm:items-center">
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-2xl text-white">
        🔔
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-bold text-slate-900">{state === "on" ? t.on : t.title}</h2>
        <p className="mt-0.5 text-sm text-slate-600">{note ?? t.lead}</p>
      </div>
      {state !== "loading" && state !== "unsupported" && state !== "ios" && state !== "denied" && (
        <button
          type="button"
          onClick={state === "on" ? turnOff : turnOn}
          disabled={state === "busy"}
          className={`press shrink-0 rounded-full px-5 py-2.5 text-sm font-bold disabled:opacity-60 ${
            state === "on" ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50" : "bg-brand text-white hover:bg-brand-deep"
          }`}
        >
          {state === "busy" ? t.busy : state === "on" ? t.turnOff : t.turnOn}
        </button>
      )}
    </section>
  );
}
