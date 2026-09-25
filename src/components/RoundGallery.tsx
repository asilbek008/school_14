"use client";

import { useState } from "react";
import Image from "next/image";
import { fill, plural } from "@/i18n/fill";
import { Carousel, PhotoViewer, type Labels } from "./Lightbox";

export type RoundAlbum = {
  /** null = photos not tied to a round. */
  round: number | null;
  /** Already formatted. */
  date: string | null;
  photos: string[];
  /** The round's best teams at our school (points of that round), when its results are in. */
  top: { team: string; points: number }[];
};

export type RoundGalleryLabels = Labels & {
  round: string;
  general: string;
  photoCount: Record<string, string>;
  results: string;
  points: string;
  viewAll: string;
  toTable: string;
  maxPoints: string;
};

const medals = ["🥇", "🥈", "🥉"];

/**
 * A program's photos by league round: round chips (newest first), then the chosen round — a large lead photo with
 * the round's name and date on it, the round's top three beside it, and the other photos in a strip to swipe
 * through. Every photo opens the full-screen viewer.
 */
export default function RoundGallery({ albums, alt, lang, t }: { albums: RoundAlbum[]; alt: string; lang: string; t: RoundGalleryLabels }) {
  const [picked, setPicked] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const album = albums[picked] ?? albums[0];
  const name = album.round ? fill(t.round, { n: album.round }) : t.general;
  const label = `${alt} — ${name}`;
  const [lead, ...rest] = album.photos;
  const labels = { close: t.close, prev: t.prev, next: t.next };

  return (
    <div>
      {albums.length > 1 && (
        <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none]">
          <div role="tablist" aria-label={alt} className="flex w-max gap-2">
            {albums.map((a, i) => {
              const active = i === picked;
              return (
                <button
                  key={a.round ?? "general"}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setPicked(i);
                    setOpen(null);
                  }}
                  className={`press inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                    active ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
                  }`}
                >
                  {a.round ? fill(t.round, { n: a.round }) : t.general}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{a.photos.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div key={album.round ?? "general"} role="tabpanel" className="animate-fade-in [animation-duration:0.35s]">
        <div className={`grid gap-4 ${album.top.length ? "lg:grid-cols-[1.75fr_1fr]" : ""}`}>
          {/* The lead photo, with the round's name on it. */}
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy text-left focus-visible:outline-3 focus-visible:outline-brand sm:aspect-[16/9]"
          >
            <Image
              src={lead}
              alt={`${label} — 1`}
              fill
              priority={picked === 0}
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover transition duration-700 ease-(--ease-spring) group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-7">
              <span>
                <span className="inline-block rounded-full bg-gold px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#241703]">{name}</span>
                <span className="font-display mt-2 block text-xl font-bold leading-tight text-white sm:text-3xl">{alt}</span>
                <span className="mt-1 block text-[13px] font-medium text-white/80 sm:text-sm">
                  {plural(t.photoCount, album.photos.length, lang)}
                  {album.date && ` · ${album.date}`}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 sm:text-sm text-white backdrop-blur-md transition group-hover:bg-white/25">
                {t.viewAll}
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </span>
            </span>
          </button>

          {/* The round's result at our school. */}
          {album.top.length > 0 && (
            <aside className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">{name}</p>
              <h3 className="font-display mt-1 text-xl font-bold text-slate-900">{t.results}</h3>
              <ol className="mt-4 space-y-2.5">
                {album.top.map((x, i) => (
                  <li key={x.team} className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 sm:py-3 ${i === 0 ? "bg-gold-soft" : "bg-slate-50"}`}>
                    <span className="text-xl leading-none sm:text-2xl" aria-hidden>
                      {medals[i]}
                    </span>
                    <b className="min-w-0 flex-1 truncate text-slate-900">{x.team}</b>
                    <span className="shrink-0 text-right">
                      <b className="font-display text-lg tabular-nums text-slate-900 sm:text-xl">{x.points}</b>
                      <span className="ml-1 text-xs font-semibold text-slate-500">{t.points}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-slate-500">{t.maxPoints}</p>
              <a href="#league" className="link-grow mt-auto self-start pt-4 text-sm font-bold text-brand">
                {t.toTable} ↑
              </a>
            </aside>
          )}
        </div>

        {rest.length > 0 && (
          <div className="mt-4">
            <Carousel photos={rest} alt={label} t={labels} size="sm" onOpen={(i) => setOpen(i + 1)} />
          </div>
        )}
      </div>

      {open !== null && <PhotoViewer photos={album.photos} alt={label} t={labels} open={open} setOpen={setOpen} />}
    </div>
  );
}
