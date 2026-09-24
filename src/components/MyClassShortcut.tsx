"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { fill } from "@/i18n/fill";
import { myClassSnapshot, parseMyClass, subscribeMyClass } from "@/lib/my-class";

/** "My class: 5-A →" above the timetable picker, when the visitor has picked one. */
export default function MyClassShortcut({ lang, label }: { lang: string; label: string }) {
  const cls = parseMyClass(useSyncExternalStore(subscribeMyClass, myClassSnapshot, () => null));
  if (!cls) return null;
  return (
    <Link
      href={`/${lang}/timetable/${cls.id}`}
      className="press mb-6 inline-flex items-center gap-2 rounded-full border border-gold bg-gold-soft px-4 py-2 text-sm font-bold text-gold-deep transition-colors hover:bg-gold hover:text-[#241703]"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
      {fill(label, { c: cls.label })} →
    </Link>
  );
}
