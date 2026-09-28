import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import StatusCheck from "./StatusCheck";

export async function generateMetadata({ params }: PageProps<"/[lang]/status">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.status.title, robots: { index: false } };
}

/** "Where is my application?" — answered by the code the parent got when they sent it. */
export default async function StatusPage({ params, searchParams }: PageProps<"/[lang]/status">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.status;
  // The confirmation screens link straight here with the code already filled in.
  const asked = (await searchParams).code;
  const initial = (Array.isArray(asked) ? asked[0] : asked) ?? "";

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.lead} />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-12">
        <StatusCheck t={t} lang={lang} initial={initial.slice(0, 40)} />
        <div className="mt-8 space-y-3 text-[13.5px] leading-relaxed text-slate-600">
          <p className="rounded-[14px] bg-gold-soft px-5 py-4 text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">{t.lost}</p>
          <p>
            <Link href={`/${lang}/reference`} className="font-bold text-brand-deep link-grow">
              {t.orderReference} →
            </Link>
            {" · "}
            <Link href={`/${lang}/admissions/apply`} className="font-bold text-brand-deep link-grow">
              {t.apply} →
            </Link>
            {school.phone && (
              <>
                {" · "}
                <a href={telHref(school.phone)} className="whitespace-nowrap font-bold text-brand-deep link-grow">
                  {school.phone}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
