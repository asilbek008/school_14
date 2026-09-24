"use client";

import { useState } from "react";
import Link from "next/link";
import { inputClass } from "@/components/admin/fields";

export type PostItem = {
  key: string;
  url: string;
  kind: "news" | "event" | "skipped" | "deleted";
  title: string | null;
  href: string | null;
  cover: string | null;
  /** Hidden on the site (auto-publish off): waiting for an admin to check it. */
  hidden: boolean;
  skipped: string | null;
  date: string;
};

const kinds = [
  { key: "news", label: "Yangiliklar", tint: "bg-blue-100 text-blue-800", one: "Yangilik" },
  { key: "event", label: "Tadbirlar", tint: "bg-teal-100 text-teal-800", one: "Tadbir" },
  { key: "skipped", label: "O‘tkazib yuborilgan", tint: "bg-slate-100 text-slate-600", one: "O‘tkazildi" },
  { key: "deleted", label: "Saytdan o‘chirilgan", tint: "bg-slate-100 text-slate-600", one: "O‘chirilgan" },
] as const;

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** Posts taken from the channel, newest first: what each became on the site, with filters and search. */
export default function PostList({ items }: { items: PostItem[] }) {
  const [kind, setKind] = useState<PostItem["kind"] | "hidden" | null>(null);
  const [query, setQuery] = useState("");
  const hiddenCount = items.filter((p) => p.hidden).length;

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (p) =>
      (!kind || (kind === "hidden" ? p.hidden : p.kind === kind)) &&
      (!q || [p.title, p.skipped].some((v) => v?.toLowerCase().includes(q))),
  );

  return (
    <div>
      <div className="mb-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sarlavha yoki sabab bo‘yicha qidirish…"
          aria-label="Qidirish"
          className={`${inputClass} mt-0`}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setKind(null)} className={chip(kind === null)}>
            Hammasi · {items.length}
          </button>
          {kinds.map((k) => (
            <button key={k.key} type="button" onClick={() => setKind(k.key)} className={chip(kind === k.key)}>
              {k.label} · {items.filter((p) => p.kind === k.key).length}
            </button>
          ))}
          {hiddenCount > 0 && (
            <button type="button" onClick={() => setKind("hidden")} className={chip(kind === "hidden")}>
              Tekshirish kutilmoqda · {hiddenCount}
            </button>
          )}
        </div>
      </div>

      {shown.length ? (
        <ul className="space-y-2">
          {shown.map((p) => {
            const k = kinds.find((x) => x.key === p.kind)!;
            return (
              <li key={p.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                  <img src={p.cover} alt="" loading="lazy" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className={`grid h-12 w-16 shrink-0 place-items-center rounded-lg text-lg ${k.tint}`} aria-hidden>
                    ✈
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {p.href ? (
                    <Link href={p.href} className="block truncate font-semibold text-slate-900 hover:text-blue-700">
                      {p.title}
                    </Link>
                  ) : (
                    <p className="truncate text-slate-500">{p.skipped ?? "Saytdan o‘chirilgan — qayta olinmaydi"}</p>
                  )}
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${k.tint}`}>{k.one}</span>
                    {p.hidden && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Yashirin — tekshiring</span>}
                    <span>{p.date}</span>
                  </p>
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-500 hover:text-blue-700 hover:underline">
                  Telegram ↗
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hech narsa topilmadi.</p>
      )}
    </div>
  );
}
