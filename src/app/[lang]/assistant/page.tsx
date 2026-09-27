import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getAssistantOn } from "@/lib/content";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import AssistantChat from "./AssistantChat";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/assistant">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.assistant.title, description: dict.assistant.intro };
}

/** The assistant: questions about the school, answered from the site's own content. */
export default async function AssistantPage({ params }: PageProps<"/[lang]/assistant">) {
  const { lang, dict } = await resolveLang(params);
  // Hidden until the school has entered a key and turned it on.
  if (!(await getAssistantOn())) notFound();
  const t = dict.assistant;

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <AssistantChat t={t} lang={lang} />
        <div className="mt-8 space-y-3 text-[13.5px] leading-relaxed text-slate-600">
          <p className="rounded-[14px] bg-gold-soft px-5 py-4 text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">{t.note}</p>
          <p>🔒 {t.privacy}</p>
          <p>
            <Link href={`/${lang}/contact`} className="font-bold text-brand-deep link-grow">
              {t.contact} →
            </Link>
            {school.phone && (
              <>
                {" · "}
                <a href={telHref(school.phone)} className="font-bold text-brand-deep link-grow">
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
