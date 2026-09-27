import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getParentBot } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import CabinetPanel from "./CabinetPanel";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/cabinet">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  // Nothing here for search engines: the page is empty until the pupil links their own cabinet.
  return { title: dict.cabinet.title, description: dict.cabinet.intro, robots: { index: false } };
}

/** The pupil's own cabinet: results that follow them between devices, linked through the school's bot. */
export default async function CabinetPage({ params }: PageProps<"/[lang]/cabinet">) {
  const { lang, dict } = await resolveLang(params);
  const bot = await getParentBot();

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={dict.cabinet.kicker} title={dict.cabinet.title} intro={dict.cabinet.intro} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <CabinetPanel t={dict.cabinet} lang={lang} bot={bot} />
      </div>
    </>
  );
}
