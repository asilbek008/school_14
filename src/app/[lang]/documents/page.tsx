import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { plural } from "@/i18n/fill";
import { documentHref, fileSize, getDocuments, localized } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { school } from "@/lib/school";
import { documentCategories, documentColors, type DocumentCategory } from "@/lib/categories";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import CategoryFilter from "@/components/CategoryFilter";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/documents">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.documents.title };
}

const cat = (value: string): DocumentCategory => (documentCategories as readonly string[]).includes(value) ? (value as DocumentCategory) : "boshqa";

/** Open documents: a card per document with its section, size and date; filtered by section and title. */
export default async function DocumentsPage({ params }: PageProps<"/[lang]/documents">) {
  if (!school.showDocuments) notFound();
  const { lang, dict } = await resolveLang(params);
  const t = dict.documents;
  const docs = await getDocuments();
  const sections = documentCategories.filter((c) => docs.some((d) => cat(d.category) === c));
  const forms = docs.filter((d) => cat(d.category) === "shakl").length;
  const stats = [
    { value: docs.length, label: plural(t.statAll, docs.length, lang) },
    { value: sections.length, label: plural(t.statCats, sections.length, lang) },
    { value: forms, label: plural(t.statForms, forms, lang) },
  ];
  const options = sections.map((c) => ({ value: c, label: `${dict.docCats[c]} · ${docs.filter((d) => cat(d.category) === c).length}` }));

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {docs.length ? (
          <>
            <StatTiles stats={stats} />
            <CategoryFilter allLabel={`${dict.common.all} · ${docs.length}`} searchLabel={t.search} emptyLabel={t.notFound} options={options}>
              <ul className="grid gap-3.5 sm:grid-cols-2">
                {docs.map((doc, i) => {
                  const title = localized(doc, "title", lang);
                  const description = localized(doc, "description", lang);
                  const href = documentHref(doc);
                  const c = cat(doc.category);
                  const meta = [
                    doc.kind === "link" ? t.external : (doc.file_type ?? "").toUpperCase(),
                    fileSize(doc.file_size, lang),
                    doc.doc_date && formatDate(doc.doc_date, lang),
                  ].filter(Boolean);
                  return (
                    <li
                      key={doc.id}
                      data-cat={c}
                      data-q={title.toLowerCase()}
                      style={{ animationDelay: `${(i % 6) * 60}ms` }}
                      className="reveal lift group relative flex flex-col rounded-[14px] border border-slate-200 bg-white p-5 hover:border-slate-300"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${documentColors[c]}`}>{dict.docCats[c]}</span>
                        {meta.map((m) => (
                          <span key={m as string} className="text-[12.5px] font-medium text-slate-500">
                            {m}
                          </span>
                        ))}
                      </div>
                      <b className="font-display text-[16.5px] leading-snug tracking-tight text-slate-900">{title}</b>
                      {description && <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">{description}</p>}
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3.5 inline-flex items-center gap-1.5 self-start text-sm font-bold text-brand link-grow"
                        >
                          {doc.kind === "link" ? t.open : t.download}
                          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                          <span className="sr-only"> ({title})</span>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CategoryFilter>
            <p className="mt-6 rounded-[14px] bg-gold-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">{t.hint}</p>
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
