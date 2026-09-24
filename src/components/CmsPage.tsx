import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getPage, localized } from "@/lib/content";
import PageHeader from "./PageHeader";
import RichText from "./RichText";
import EmptyState from "./EmptyState";

/** An admin-editable page from the `pages` table (About, Admissions). */
export default async function CmsPage({
  slug,
  fallbackTitle,
  lang,
  dict,
}: {
  slug: string;
  fallbackTitle: string;
  lang: Locale;
  dict: Dictionary;
}) {
  const page = await getPage(slug);
  const body = page ? localized(page, "body", lang) : "";

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={page ? localized(page, "title", lang) : fallbackTitle} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {body ? <RichText text={body} /> : <EmptyState>{dict.common.comingSoon}</EmptyState>}
      </div>
    </>
  );
}
