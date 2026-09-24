import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.faq.title };
}

/** Questions and answers as in the design mockup: an accordion, with a "didn't find it?" contact card beside it. */
export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.faq;

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={t.title} intro={t.intro} kicker={dict.nav.faq} />
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-10 sm:py-12 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="space-y-2.5">
            {t.items.map((item, i) => (
              <details
                key={item.q}
                style={{ animationDelay: `${i * 50}ms` }}
                className="acc reveal group rounded-[14px] border border-slate-200 bg-white transition-[border-color,box-shadow] duration-200 hover:border-slate-300 open:border-brand open:shadow-[0_12px_24px_-12px_rgb(19_26_46/0.18)]"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3.5 rounded-[14px] px-[18px] py-[15px] [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-base font-bold leading-snug text-slate-900">{item.q}</span>
                  <svg viewBox="0 0 24 24" className="ml-auto size-[18px] shrink-0 text-slate-400 transition-transform duration-300 ease-(--ease-spring) group-open:rotate-180 group-open:text-brand" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <div className="px-[18px] pb-[18px] text-[14.5px] leading-relaxed text-slate-600">
                  <p className="whitespace-pre-line">{item.a}</p>
                  {"link" in item && item.link && (
                    <Link href={`/${lang}${item.link}`} className="mt-2.5 inline-flex items-center gap-1 text-sm font-bold text-brand link-grow">
                      {t.open} →
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>

        <aside className="reveal rounded-[14px] border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-slate-900">{t.moreTitle}</h2>
          <p className="mt-1.5 text-sm text-slate-600">{t.moreText}</p>
          <div className="mt-4 grid gap-2.5">
            <Link
              href={`/${lang}/contact`}
              className="press rounded-full bg-brand px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-deep"
            >
              {dict.admissions.write}
            </Link>
            {school.phone && (
              <a
                href={telHref(school.phone)}
                className="press rounded-full border-[1.5px] border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition-colors hover:border-brand hover:text-brand"
              >
                {school.phone}
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
