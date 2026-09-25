"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";

export type Labels = { close: string; prev: string; next: string };

/**
 * Photo grid; clicking a photo opens a full-screen viewer: Esc closes, ←/→ move between photos, and the photo
 * follows a finger (or a mouse drag) sideways — let go past a fifth of the screen, or flick, and the next one
 * slides in; swipe down to close. Thumbnails jump. `mosaic` makes the first photo large (news articles), `grid`
 * is even (albums), `carousel` is a row to swipe through right on the page (arrows on wider screens).
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
  layout?: "grid" | "mosaic" | "carousel";
  /** Column classes of the even grid (e.g. four in a row for a short strip). */
  gridClassName?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const mosaic = layout === "mosaic" && photos.length >= 3;

  return (
    <>
      {layout === "carousel" ? (
        <Carousel photos={photos} alt={alt} t={t} onOpen={setOpen} />
      ) : (
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
      )}

      {open !== null && <PhotoViewer photos={photos} alt={alt} t={t} open={open} setOpen={setOpen} />}
    </>
  );
}

// Round glass buttons, as in the design mockup.
const navBtn =
  "grid size-[46px] shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white/25";

/**
 * The full-screen viewer, also for galleries with their own layout (RoundGallery): the photo follows a finger or a
 * mouse drag, the neighbours wait beside it; swipe down closes.
 */
export function PhotoViewer({
  photos,
  alt,
  t,
  open,
  setOpen,
}: {
  photos: string[];
  alt: string;
  t: Labels;
  open: number;
  setOpen: Dispatch<SetStateAction<number | null>>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number; t: number; moved: boolean } | null>(null);
  // How far the photo is dragged (px), and where it is gliding to after the finger lifts (±1 = the neighbour).
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [settle, setSettle] = useState<-1 | 0 | 1 | null>(null);
  const many = photos.length > 1;
  const move = useCallback(
    (step: number) => setOpen((i) => (i === null ? i : (i + step + photos.length) % photos.length)),
    [photos.length, setOpen],
  );
  const settleTimer = useRef<number | undefined>(undefined);
  const finish = useCallback(
    (to: -1 | 0 | 1) => {
      window.clearTimeout(settleTimer.current);
      if (to) move(to);
      setSettle(null);
      setDrag({ x: 0, y: 0 });
    },
    [move],
  );
  // Glide to a neighbour (±1) or back (0). The timer finishes it when there is no transition (reduced motion).
  const glide = useCallback(
    (to: -1 | 0 | 1) => {
      setSettle(to);
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => finish(to), 380);
    },
    [finish],
  );

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft" && many) glide(-1);
      if (e.key === "ArrowRight" && many) glide(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, many, glide, setOpen]);

  // Keep the current thumbnail in view.
  useEffect(() => {
    thumbsRef.current?.children[open]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [open]);


  return (
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

        <div className="relative flex items-center justify-between gap-3 p-4 text-white">
          <span className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-full bg-black/30 px-3 py-1 text-sm font-semibold tabular-nums backdrop-blur">
              {open + 1} / {photos.length}
            </span>
            <span className="truncate text-sm font-semibold text-[#d6dcee]">{alt}</span>
          </span>
          <button ref={closeRef} type="button" aria-label={t.close} onClick={() => setOpen(null)} className={navBtn}>
            <Icon d="M6 6l12 12M18 6L6 18" />
          </button>
        </div>

        <div
          // touch-none: the browser must not turn a sideways swipe into scrolling or zooming.
          className="relative min-h-0 flex-1 touch-none select-none overflow-hidden"
          onPointerDown={(e) => {
            if (settle !== null || e.button !== 0) return;
            swipe.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const start = swipe.current;
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) start.moved = true;
            // Sideways follows the finger (only with a neighbour to show); downwards pulls the photo away to close.
            setDrag(Math.abs(dx) >= Math.abs(dy) ? { x: many ? dx : dx / 4, y: 0 } : { x: 0, y: Math.max(0, dy) });
          }}
          onPointerCancel={() => {
            swipe.current = null;
            glide(0);
          }}
          onPointerUp={(e) => {
            const start = swipe.current;
            swipe.current = null;
            if (!start?.moved) return finish(0);
            const width = e.currentTarget.clientWidth;
            const dx = e.clientX - start.x;
            const fast = Math.abs(dx) / Math.max(1, e.timeStamp - start.t) > 0.5; // a flick, px per ms
            if (drag.y > 120) return setOpen(null), finish(0);
            glide(many && drag.x !== 0 && (Math.abs(dx) > width / 5 || (fast && Math.abs(dx) > 30)) ? (dx < 0 ? 1 : -1) : 0);
          }}
          onClickCapture={(e) => {
            // The click that ends a drag must not close the viewer.
            if (drag.x || drag.y || settle !== null) e.stopPropagation();
          }}
        >
          {/* The open photo between its neighbours; the strip moves with the finger, then glides. */}
          <div
            className={`absolute inset-0 ${settle !== null ? "transition-transform duration-300 ease-out motion-reduce:transition-none" : ""}`}
            style={{
              transform:
                settle !== null
                  ? `translate3d(${-settle * 100}%, 0, 0)`
                  : `translate3d(${drag.x}px, ${drag.y}px, 0) scale(${1 - Math.min(drag.y, 400) / 1600})`,
              opacity: drag.y ? 1 - Math.min(drag.y, 400) / 600 : undefined,
            }}
            onTransitionEnd={(e) => e.target === e.currentTarget && settle !== null && finish(settle)}
          >
            {(many ? [-1, 0, 1] : [0]).map((d) => {
              const i = (open + d + photos.length) % photos.length;
              return (
                <div key={`${d}-${i}`} className="absolute inset-0 flex items-center justify-center px-2 sm:px-20" style={{ left: `${d * 100}%` }}>
                  <Photo src={photos[i]} alt={`${alt} — ${i + 1}`} priority={d === 0} />
                </div>
              );
            })}
          </div>
          {many && (
            <>
              <button type="button" aria-label={t.prev} onClick={(e) => { e.stopPropagation(); glide(-1); }} className={`${navBtn} absolute left-[18px] top-1/2 hidden -translate-y-1/2 sm:grid`}>
                <Icon d="M15 6l-6 6 6 6" />
              </button>
              <button type="button" aria-label={t.next} onClick={(e) => { e.stopPropagation(); glide(1); }} className={`${navBtn} absolute right-[18px] top-1/2 hidden -translate-y-1/2 sm:grid`}>
                <Icon d="M9 6l6 6-6 6" />
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
      </div>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

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
function Photo({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  return (
    <div
      className="relative h-full w-full"
      style={natural ? { maxWidth: natural.w * 1.5, maxHeight: natural.h * 1.5 } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        priority={priority}
        draggable={false}
        className="object-contain drop-shadow-2xl"
        onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      />
    </div>
  );
}

/**
 * Photos in a row to swipe through on the page (native scrolling with snap points, so it feels like the phone's own
 * gallery); arrows on wider screens, a counter and dots below. A tap opens the full-screen viewer.
 */
export function Carousel({
  photos,
  alt,
  t,
  onOpen,
  size = "md",
}: {
  photos: string[];
  alt: string;
  t: Labels;
  onOpen: (i: number) => void;
  /** `sm`: a thumbnail strip (about five in a row on wide screens). */
  size?: "md" | "sm";
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ index: 0, start: true, end: photos.length <= 1 });
  const slide = (i: number) => strip.current?.children[i] as HTMLElement | undefined;
  const onScroll = () => {
    const el = strip.current;
    if (!el) return;
    const width = slide(0)?.offsetWidth ?? el.clientWidth;
    setAt({
      index: Math.min(photos.length - 1, Math.round(el.scrollLeft / (width + 12))),
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8,
    });
  };
  const go = (i: number) => {
    const target = slide(Math.max(0, Math.min(photos.length - 1, i)));
    if (target && strip.current) strip.current.scrollTo({ left: target.offsetLeft - strip.current.offsetLeft, behavior: "smooth" });
  };
  const arrow =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-navy shadow-lg transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 sm:grid";

  return (
    <div className="relative">
      <div
        ref={strip}
        onScroll={onScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] motion-reduce:scroll-auto sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => onOpen(i)}
            className={`group relative aspect-[4/3] shrink-0 cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-brand-soft focus-visible:outline-3 focus-visible:outline-brand ${
              size === "sm"
                ? "w-[44%] snap-start sm:w-[calc((100%-36px)/4)] lg:w-[calc((100%-48px)/5)]"
                : "w-[86%] snap-center sm:w-[calc(50%-6px)] sm:snap-start lg:w-[calc((100%-24px)/3)]"
            }`}
          >
            <Image
              src={src}
              alt={`${alt} — ${i + 1}`}
              fill
              sizes={size === "sm" ? "(min-width: 1024px) 20vw, (min-width: 640px) 25vw, 44vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 86vw"}
              draggable={false}
              className="object-cover transition duration-500 ease-(--ease-spring) group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button type="button" aria-label={t.prev} disabled={at.start} onClick={() => go(at.index - 1)} className={`${arrow} -left-4`}>
            <Icon d="M15 6l-6 6 6 6" />
          </button>
          <button type="button" aria-label={t.next} disabled={at.end} onClick={() => go(at.index + 1)} className={`${arrow} -right-4`}>
            <Icon d="M9 6l6 6-6 6" />
          </button>
          <div className="mt-3 flex items-center justify-center gap-3">
            {photos.length <= 12 && (
              <span className="flex gap-1.5" aria-hidden>
                {photos.map((src, i) => (
                  <span key={src} className={`h-1.5 rounded-full transition-all duration-300 ${i === at.index ? "w-5 bg-brand" : "w-1.5 bg-slate-300"}`} />
                ))}
              </span>
            )}
            <span className="text-xs font-semibold tabular-nums text-slate-500">
              {at.index + 1} / {photos.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
