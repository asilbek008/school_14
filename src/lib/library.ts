import type { Locale } from "@/i18n/config";
import { fileSize, localized, mediaUrl, textbookHref, type Textbook } from "./content";

/** A file name for the downloaded PDF: the title in plain letters. */
export function pdfFileName(title: string): string {
  const base = title
    .replace(/[‘’`ʻʼ']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "kitob"}.pdf`;
}

/** Supabase serves a public file as an attachment when asked with ?download=<name>. */
export function downloadHref(b: Textbook, title: string): string | null {
  if (b.kind !== "file") return null;
  const url = mediaUrl(b.path);
  return url ? `${url}?download=${encodeURIComponent(pdfFileName(title))}` : null;
}

export function bookView(b: Textbook, lang: Locale) {
  const title = localized(b, "title", lang);
  return {
    id: b.id,
    title,
    author: b.author,
    grade: b.grade,
    subjectId: b.subjects?.id ?? null,
    subject: b.subjects ? localized(b.subjects, "name", lang) : null,
    language: b.language,
    pages: b.pages,
    size: fileSize(b.file_size, lang),
    cover: mediaUrl(b.cover),
    file: textbookHref(b),
    download: downloadHref(b, title),
    external: b.kind === "link",
  };
}
