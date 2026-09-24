"use client";

import { useState } from "react";
import Link from "next/link";
import Status from "@/components/admin/Status";
import { inputClass } from "@/components/admin/fields";
import type { NewsCategory } from "@/lib/categories";

export type NewsItem = {
  id: number;
  title: string;
  slug: string;
  category: NewsCategory;
  cover: string | null;
  date: string | null;
  photos: number;
  videos: number;
  telegram: boolean;
  published: boolean;
};

const categories: { key: NewsCategory; label: string; tint: string }[] = [
  { key: "yangilik", label: "Yangilik", tint: "bg-blue-100 text-blue-800" },
  { key: "elon", label: "E’lon", tint: "bg-amber-100 text-amber-800" },
  { key: "tadbir", label: "Tadbir", tint: "bg-teal-100 text-teal-800" },
  { key: "yutuq", label: "Yutuq", tint: "bg-violet-100 text-violet-800" },
];
const tintOf = Object.fromEntries(categories.map((c) => [c.key, c])) as Record<NewsCategory, (typeof categories)[number]>;

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** All news, newest first, with search and category / status filters. */
export default function NewsList({ items }: { items: NewsItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<NewsCategory | null>(null);
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (n) =>
      (!category || n.category === category) &&
      (status === "all" || n.published === (status === "published")) &&
      (!q || n.title.toLowerCase().includes(q) || n.slug.includes(q)),
  );
  const drafts = items.filter((n) => !n.published).length;

  return (
    <div>
      <div className="mb-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sarlavha bo‘yicha qidirish…"
          aria-label="Qidirish"
          className={`${inputClass} mt-0`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setCategory(null)} className={chip(category === null)}>
            Hammasi · {items.length}
          </button>
          {categories.map((c) => (
            <button key={c.key} type="button" onClick={() => setCategory(c.key)} className={chip(category === c.key)}>
              {c.label} · {items.filter((n) => n.category === c.key).length}
            </button>
          ))}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            aria-label="Holati"
            className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">Barcha holatlar</option>
            <option value="published">Saytda</option>
            <option value="draft">Yashirin · {drafts}</option>
          </select>
        </div>
      </div>

      {shown.length ? (
        <ul className="space-y-2.5">
          {shown.map((n) => (
            <li key={n.id}>
              <Link
                href={`/admin/news/${n.id}`}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 sm:gap-4"
              >
                {n.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                  <img src={n.cover} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-lg object-cover sm:h-16 sm:w-24" />
                ) : (
                  <span className={`grid h-14 w-20 shrink-0 place-items-center rounded-lg text-xl font-bold sm:h-16 sm:w-24 ${tintOf[n.category].tint}`}>
                    {n.title.charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 group-hover:text-blue-700">{n.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tintOf[n.category].tint}`}>{tintOf[n.category].label}</span>
                    <span>{n.date ?? "Sana yo‘q"}</span>
                    {n.photos > 0 && <span>📷 {n.photos}</span>}
                    {n.videos > 0 && <span>🎬 {n.videos}</span>}
                    {n.telegram && <span className="text-sky-700">✈ Telegram</span>}
                  </p>
                </div>
                <Status published={n.published} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hech narsa topilmadi.</p>
      )}
    </div>
  );
}
