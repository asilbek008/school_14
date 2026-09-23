"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type Labels = { close: string; prev: string; next: string };

/** Photo grid; clicking a photo opens it full-screen. Esc closes, ←/→ move between photos. */
export default function Lightbox({ photos, alt, t }: { photos: string[]; alt: string; t: Labels }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
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

  const navBtn = "grid size-12 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className="relative aspect-square overflow-hidden rounded-xl bg-slate-200 focus-visible:outline-3 focus-visible:outline-brand"
          >
            <Image src={src} alt={`${alt} — ${i + 1}`} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-300 hover:scale-105" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[open]} alt={`${alt} — ${open + 1}`} fill sizes="100vw" className="object-contain" priority />
          </div>
          <button ref={closeRef} type="button" aria-label={t.close} onClick={() => setOpen(null)} className={`${navBtn} absolute right-4 top-4`}>
            ×
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" aria-label={t.prev} onClick={(e) => { e.stopPropagation(); move(-1); }} className={`${navBtn} absolute left-4 top-1/2 -translate-y-1/2`}>
                ‹
              </button>
              <button type="button" aria-label={t.next} onClick={(e) => { e.stopPropagation(); move(1); }} className={`${navBtn} absolute right-4 top-1/2 -translate-y-1/2`}>
                ›
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {open + 1} / {photos.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
