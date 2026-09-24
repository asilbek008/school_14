"use client";

import { useSyncExternalStore } from "react";
import { myClassSnapshot, parseMyClass, setMyClass, subscribeMyClass, type MyClass } from "@/lib/my-class";

/** Star button on a class's timetable: marks it as "my class" (or unmarks it). */
export default function MyClassButton({ cls, t }: { cls: MyClass; t: { save: string; saved: string; saveHint: string } }) {
  const raw = useSyncExternalStore(subscribeMyClass, myClassSnapshot, () => null);
  const mine = parseMyClass(raw)?.id === cls.id;
  // Nothing on the server render: the choice is only known in the browser.
  if (raw === null) return <span className="h-9" />;
  return (
    <button
      type="button"
      aria-pressed={mine}
      title={t.saveHint}
      onClick={() => setMyClass(mine ? null : cls)}
      className={`press inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${
        mine ? "border-gold bg-gold-soft text-gold-deep" : "border-slate-200 bg-white text-slate-700 hover:border-gold hover:text-gold-deep"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill={mine ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
      {mine ? t.saved : t.save}
    </button>
  );
}
