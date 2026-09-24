"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type Labels = { close: string; prev: string; next: string };

/**
 * Photo grid; clicking a photo opens a full-screen viewer: Esc closes, ←/→ or a swipe move between
 * photos, thumbnails jump. `mosaic` makes the first photo large (news articles), `grid` is even (albums).
 * Small photos (Telegram copies) are never blown up far past their real size, and sit on a blurred
 * copy of themselves instead of black bars, so they still look good.
 */
export default function Lightbox({
  photos,
  alt,
  t,
  layout = "grid",
  gridClassName = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
}: {
  photos: string[];
  alt: string;
  t: Labels;
  layout?: "grid" | "mosaic";
  /** Column classes of the even grid (e.g. four in a row for a short strip). */
  gridClassName?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const move = useCallback(
    (step: number) => setOpen((i) => (i === null ? i : (i + step + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, move]);

  // Keep the current thumbnail in view.
  useEffect(() => {
    if (open === null) return;
    thumbsRef.current?.children[open]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [open]);

  const mosaic = layout === "mosaic" && photos.length >= 3;
  const navBtn =
    "grid size-12 place-items-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition hover:scale-110 hover:bg-white/25";

  return (
    <>
      <div
        className={
          mosaic
            ? "grid auto-rows-[9rem] grid-cols-2 gap-2 sm:auto-rows-[11rem] sm:gap-3 md:grid-cols-4"
            : `grid gap-3 ${gridClassName}`
        }
      >
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden rounded-2xl bg-brand-soft focus-visible:outline-3 focus-visible:outline-brand ${
              mosaic ? mosaicSpan(i, photos.length) : "aspect-[25/18] cursor-zoom-in rounded-xl border border-slate-200"
            }`}
          >
            <Image
              src={src}
              alt={`${alt} — ${i + 1}`}
              fill
              sizes={mosaic && i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
              className="object-cover transition duration-500 ease-(--ease-spring) group-hover:scale-110"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="absolute bottom-2 right-2 grid size-9 translate-y-2 place-items-center rounded-full bg-white/90 text-navy opacity-0 shadow transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-black [animation-duration:0.25s]"
          onClick={() => setOpen(null)}
        >
          {/* Blurred copy of the photo fills the screen behind it. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <Image key={`bg-${open}`} src={photos[open]} alt="" fill sizes="64px" className="scale-125 object-cover opacity-50 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between p-4 text-white">
            <span className="rounded-full bg-black/30 px-3 py-1 text-sm font-semibold tabular-nums backdrop-blur">
              {open + 1} / {photos.length}
            </span>
            <button ref={closeRef} type="button" aria-label={t.close} onClick={() => setOpen(null)} className={navBtn}>
              ×
            </button>
          </div>

          <div
            // touch-none: the browser must not turn a sideways swipe into scrolling or zooming.
            className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center px-2 sm:px-20"
            onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
            onPointerCancel={() => (swipe.current = null)}
            onPointerUp={(e) => {
              const start = swipe.current;
              swipe.current = null;
              if (!start) return;
              const dx = e.clientX - start.x;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - start.y)) move(dx < 0 ? 1 : -1);
            }}
          >
            <Photo key={open} src={photos[open]} alt={`${alt} — ${open + 1}`} />
            {photos.length > 1 && (
              <>
                <button type="button" aria-label={t.prev} onClick={(e) => { e.stopPropagation(); move(-1); }} className={`${navBtn} absolute left-3 top-1/2 hidden -translate-y-1/2 sm:grid`}>
                  ‹
                </button>
                <button type="button" aria-label={t.next} onClick={(e) => { e.stopPropagation(); move(1); }} className={`${navBtn} absolute right-3 top-1/2 hidden -translate-y-1/2 sm:grid`}>
                  ›
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div ref={thumbsRef} className="relative flex shrink-0 gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
              {photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`${i + 1}`}
                  aria-current={i === open}
                  onClick={() => setOpen(i)}
                  className={`relative size-14 shrink-0 overflow-hidden rounded-lg transition sm:size-16 ${
                    i === open ? "ring-2 ring-white" : "opacity-50 hover:opacity-90"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
          {/* Neighbours load in the background so the next swipe is instant. */}
          <div className="hidden" aria-hidden>
            {[-1, 1].map((d) => {
              const i = (open + d + photos.length) % photos.length;
              return <Image key={`pre-${i}`} src={photos[i]} alt="" width={1920} height={1280} sizes="100vw" priority />;
            })}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Mosaic cell size, so rows always end flush: the first photo is 2×2; on phones (2 columns) an odd
 * last photo spans the row; on md+ (4 columns) the photos beside the big one and in the last row
 * widen to fill their row.
 */
function mosaicSpan(i: number, n: number): string {
  if (i === 0) return "col-span-2 row-span-2";
  const phone = (n - 1) % 2 === 1 && i === n - 1 ? "col-span-2" : "";
  let md = "";
  const beside = Math.min(n - 1, 4);
  if (i <= 4) {
    if (beside === 2 || (beside === 3 && i === 1)) md = "md:col-span-2";
  } else {
    const left = (n - 5) % 4;
    const firstOfLast = n - left;
    if (left && i >= firstOfLast) {
      if (left === 1) md = "md:col-span-4";
      else if (left === 2 || i === firstOfLast) md = "md:col-span-2";
    }
  }
  if (phone && !md) md = "md:col-span-1";
  return `${phone} ${md}`;
}

/** The open photo: fades in, and is shown at most 1.5× its real size so a small photo stays sharp. */
function Photo({ src, alt }: { src: string; alt: string }) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  return (
    <div
      className="relative h-full w-full animate-fade-in [animation-duration:0.35s]"
      style={natural ? { maxWidth: natural.w * 1.5, maxHeight: natural.h * 1.5 } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        priority
        draggable={false}
        className="object-contain drop-shadow-2xl"
        onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      />
    </div>
  );
}
