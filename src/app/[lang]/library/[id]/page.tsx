import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getTextbook, localized } from "@/lib/content";
import { bookView } from "@/lib/library";
import PdfReader from "@/components/PdfReader";
import RichText from "@/components/RichText";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/library/[id]">): Promise<Metadata> {
  const { lang, dict } = await resolveLang(params);
  const book = await getTextbook(Number((await params).id));
  return { title: book ? localized(book, "title", lang) : dict.library.title };
}

/** One book: the reader fills the screen under the site header; details follow below it. */
export default async function BookPage({ params }: PageProps<"/[lang]/library/[id]">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.library;
  const book = await getTextbook(Number((await params).id));
  if (!book) notFound();
  const b = bookView(book, lang);
  const description = localized(book, "description", lang);
  const facts = [
    [t.subject, b.subject],
    [t.class, b.grade ? fill(t.grade, { n: b.grade }) : t.general],
    [t.author, b.author],
    [t.edition, book.edition],
    [t.language, t.languages[b.language]],
    [t.size, [b.pages && plural(t.pages, b.pages, lang), b.size].filter(Boolean).join(" · ")],
    [t.source, book.source],
  ].filter((f): f is [string, string] => !!f[0] && !!f[1]);

  return (
    <>
      {b.file && !b.external ? (
        <PdfReader id={b.id} url={b.file} title={b.title} backHref={`/${lang}/library`} t={t.reader} />
      ) : (
        <div className="chrome px-4 py-16 text-center text-white">
          <h1 className="font-display text-3xl font-bold">{b.title}</h1>
          {b.file && (
            <a href={b.file} target="_blank" rel="noopener noreferrer" className="press mt-6 inline-block rounded-full bg-gold px-6 py-3 font-bold text-[#241703]">
              {t.open}
            </a>
          )}
          <p className="mt-2 text-sm text-slate-300">{t.external}</p>
        </div>
      )}
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{b.title}</h1>
        <dl className="mt-5 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-[auto_1fr]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        {description && (
          <div className="mt-6 text-slate-700">
            <RichText text={description} />
          </div>
        )}
        {b.download && (
          <a href={b.download} className="press mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-deep">
            ⬇ {t.download}
            {b.size && <span className="font-normal opacity-80">({b.size})</span>}
          </a>
        )}
      </section>
    </>
  );
}
