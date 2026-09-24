import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getHomerooms, getStaff, localized, mediaUrl } from "@/lib/content";
import { findPosition, positionKey, positionLabel, staffPositions } from "@/lib/positions";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StaffDirectory from "@/components/StaffDirectory";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/staff">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.staff.title };
}

export default async function StaffPage({ params }: PageProps<"/[lang]/staff">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.staff;
  const [staff, homerooms] = await Promise.all([getStaff(), getHomerooms()]);
  const rows = staff.map((p) => ({
    id: p.id,
    name: p.full_name,
    position: positionLabel(p, lang),
    positionKey: positionKey(p.position_uz),
    subject: localized(p, "subject", lang) || null,
    homeroom: homerooms[p.id] ?? null,
    photo: mediaUrl(p.photo),
  }));
  // The owner's list in its order, then any other position someone has.
  const positions = [
    ...staffPositions.map((p) => ({ value: positionKey(p.uz), label: p[lang] })),
    ...[...new Map(staff.filter((p) => !findPosition(p.position_uz)).map((p) => [positionKey(p.position_uz), positionLabel(p, lang)]))].map(
      ([value, label]) => ({ value, label }),
    ),
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        kicker={t.kicker}
        title={t.title}
        intro={staff.length ? fill(t.countIntro, { n: staff.length }) : t.intro}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {rows.length ? <StaffDirectory rows={rows} positions={positions} lang={lang} t={t} /> : <EmptyState>{t.empty}</EmptyState>}
      </div>
    </>
  );
}
