import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.faq };
}

export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang, dict } = await resolveLang(params);

  return (
    <>
      <PageHeader title={dict.nav.faq} intro={dict.faq.intro} kicker={dict.nav.school} />
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-12">
        {dict.faq.items.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-slate-200 bg-white open:border-brand open:shadow-lg"
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 font-bold [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg viewBox="0 0 24 24" className="ml-auto size-5 shrink-0 text-slate-400 transition group-open:rotate-180 group-open:text-brand" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <p className="whitespace-pre-line px-5 pb-5 text-slate-600">{item.a}</p>
          </details>
        ))}
        <p className="pt-4 text-sm text-slate-500">
          <Link href={`/${lang}/contact`} className="font-bold text-brand link-grow">
            {dict.nav.contact} →
          </Link>
        </p>
      </div>
    </>
  );
}
