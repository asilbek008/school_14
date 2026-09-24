"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

// Error boundaries are client components, so the three languages' text is here rather than in the dictionaries.
const text = {
  uz: { title: "Xatolik yuz berdi", lead: "Sahifani ochib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring.", retry: "Qayta urinish", home: "Bosh sahifa" },
  ru: { title: "Произошла ошибка", lead: "Не удалось открыть страницу. Попробуйте ещё раз чуть позже.", retry: "Попробовать снова", home: "Главная" },
  en: { title: "Something went wrong", lead: "The page could not be opened. Please try again in a moment.", retry: "Try again", home: "Home page" },
};

/** Shown instead of a blank screen when a page fails; the header and footer stay. */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const t = text[lang as keyof typeof text] ?? text.uz;
  useEffect(() => console.error(error), [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-gold">!</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">{t.title}</h1>
      <p className="mt-2 text-slate-600">{t.lead}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="press rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-deep">
          {t.retry}
        </button>
        <Link href={`/${lang ?? "uz"}`} className="press rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:border-brand hover:text-brand">
          {t.home}
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-xs text-slate-400">#{error.digest}</p>}
    </div>
  );
}
