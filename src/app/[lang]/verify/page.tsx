import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import PageHeader from "@/components/PageHeader";
import VerifyCheck from "./VerifyCheck";

export async function generateMetadata({ params }: PageProps<"/[lang]/verify">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.verify.title, robots: { index: false } };
}

/** Where a certificate's QR leads: is this paper one the school actually issued? */
export default async function VerifyPage({ params, searchParams }: PageProps<"/[lang]/verify">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.verify;
  const asked = (await searchParams).code;
  const initial = (Array.isArray(asked) ? asked[0] : asked) ?? "";

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.lead} />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-12">
        <VerifyCheck t={t} lang={lang} initial={initial.slice(0, 40)} />
        <div className="mt-8 space-y-3 text-[13.5px] leading-relaxed text-slate-600">
          <p className="rounded-[14px] bg-gold-soft px-5 py-4 text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">{t.noQr}</p>
          <p>
            <Link href={`/${lang}/tests`} className="font-bold text-brand-deep link-grow">
              {dict.nav.tests} →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
