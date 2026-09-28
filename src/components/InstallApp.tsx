"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISSED = "installHidden";
const noop = () => () => {};

/** "hide" once installed or closed for good, "ios" where there is no install prompt, else "wait". */
type Env = "hide" | "ios" | "wait";
let cached: Env | null = null;

function env(): Env {
  if (cached) return cached;
  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  let closed = false;
  try {
    closed = localStorage.getItem(DISMISSED) !== null;
  } catch {
    // A blocked storage is no reason to hide the card.
  }
  cached = installed || closed ? "hide" : /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "wait";
  return cached;
}

/**
 * Invites the visitor to keep the site as an app. Chrome hands the page its own install prompt, so there the
 * card is a single button; iPhone gives no such prompt, so there it explains the two taps instead. It stays
 * away once the app is installed, and for good if the visitor closes it.
 */
export default function InstallApp({ t }: { t: Dictionary["install"] }) {
  // Read in the browser only: the card must never be in the cached HTML.
  const where = useSyncExternalStore(noop, env, (): Env => "hide");
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Prompt);
    };
    const onInstalled = () => setClosed(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const ios = where === "ios";
  if (closed || where === "hide" || (!ios && !prompt)) return null;

  const close = () => {
    setClosed(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Nothing to do; the card simply returns next time.
    }
  };

  return (
    <div className="reveal relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-teal p-5 text-white sm:px-7 sm:py-6">
      <button
        type="button"
        onClick={close}
        aria-label={t.close}
        className="press absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-lg leading-none"
      >
        ×
      </button>
      <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-center sm:gap-6">
        <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-2xl font-extrabold">
          14
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-[17px]">{t.title}</b>
          <p className="mt-1 text-[13.5px] leading-relaxed text-white/85">{ios ? t.iosSteps : t.lead}</p>
        </div>
        {prompt && (
          <button
            type="button"
            onClick={async () => {
              await prompt.prompt();
              await prompt.userChoice;
              setPrompt(null);
              setClosed(true);
            }}
            className="press shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy"
          >
            {t.button}
          </button>
        )}
      </div>
    </div>
  );
}
