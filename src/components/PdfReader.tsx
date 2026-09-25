"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { openPdf } from "@/lib/pdf";
import { readProgress, saveProgress } from "@/lib/book-progress";

type T = Dictionary["library"]["reader"];

const GAP = 12;
const noSubscribe = () => () => {};
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

/**
 * Reads a PDF right on the page: pages drawn as they scroll into view (and dropped far away, so a
 * 300-page book stays light on a phone), page number box, zoom, full screen, keyboard arrows, and the
 * last page read remembered in this browser.
 */
export default function PdfReader({ id, url, title, backHref, t }: { id: number; url: string; title: string; backHref: string; t: T }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(1.414);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("1");
  const [resume, setResume] = useState<number | null>(null);
  const [full, setFull] = useState(false);
  // Element fullscreen (not on iPhone Safari); only known in the browser.
  const canFull = useSyncExternalStore(noSubscribe, () => !!document.fullscreenEnabled, () => false);

  // Open the book (only the first pages are fetched).
  useEffect(() => {
    let alive = true;
    let opened: PDFDocumentProxy | null = null;
    openPdf(url, (p) => alive && setProgress(p))
      .then(async (d) => {
        opened = d;
        if (!alive) return d.loadingTask.destroy();
        const first = await d.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        if (!alive) return;
        setRatio(vp.height / vp.width);
        setDoc(d);
        const saved = readProgress()[id];
        if (saved && saved > 1 && saved <= d.numPages) setResume(saved);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      opened?.loadingTask.destroy();
    };
  }, [url, id]);

  // Reader width follows the screen; fullscreen support is only known in the browser.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    const onFull = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFull);
    return () => {
      ro.disconnect();
      document.removeEventListener("fullscreenchange", onFull);
    };
  }, []);

  const numPages = doc?.numPages ?? 0;
  // Fit width with side room on large screens; zoom multiplies it.
  const fitWidth = Math.max(200, Math.min(width - 24, 900));
  const pageWidth = Math.round(fitWidth * zoom);
  const pageHeight = Math.round(pageWidth * ratio);
  const step = pageHeight + GAP;

  const goTo = useCallback(
    (n: number) => {
      const el = scrollRef.current;
      if (!el || !numPages) return;
      const target = Math.min(Math.max(1, n), numPages);
      el.scrollTo({ top: (target - 1) * step, behavior: "auto" });
      setPage(target);
      setInput(String(target));
      saveProgress(id, target);
    },
    [numPages, step, id],
  );

  // Current page from the scroll position; remembered as the reader goes.
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || !numPages) return;
    const n = Math.min(numPages, Math.max(1, Math.floor((el.scrollTop + el.clientHeight / 3) / step) + 1));
    if (n !== page) {
      setPage(n);
      setInput(String(n));
      saveProgress(id, n);
      if (resume && n > 1) setResume(null);
    }
  };

  // Keep the same page in view when the zoom changes.
  const setZoomKeep = (z: number) => {
    const current = page;
    setZoom(z);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = (current - 1) * (Math.round(Math.round(fitWidth * z) * ratio) + GAP);
    });
  };
  const zoomBy = (dir: 1 | -1) => {
    const i = ZOOMS.findIndex((z) => z >= zoom - 0.001);
    const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (i < 0 ? 2 : i) + dir))];
    setZoomKeep(next);
  };

  // Keyboard: ← → PageUp PageDown Home End, + and -.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(page + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(page - 1);
      else if (e.key === "Home") goTo(1);
      else if (e.key === "End") goTo(numPages);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, page, numPages]);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen().catch(() => {});
  };

  const btn = "grid size-9 shrink-0 place-items-center rounded-lg text-white/90 transition hover:bg-white/10 disabled:opacity-35";
  return (
    <div ref={wrapRef} className="flex h-[calc(100dvh-64px)] flex-col bg-[#1f2937] md:h-[calc(100dvh-104px)] lg:h-[calc(100dvh-114px)]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-navy px-2 py-1.5 text-white sm:gap-2 sm:px-4">
        <Link href={backHref} aria-label={t.back} title={t.back} className={btn}>
          <Icon d="M15 18l-6-6 6-6" />
        </Link>
        <p className="hidden min-w-0 flex-1 truncate text-sm font-semibold md:block">{title}</p>
        <span className="flex-1 md:hidden" />
        <button type="button" onClick={() => goTo(page - 1)} disabled={!doc || page <= 1} aria-label={t.prev} title={t.prev} className={btn}>
          <Icon d="M18 15l-6-6-6 6" />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goTo(Number(input) || 1);
          }}
          className="flex items-center gap-1 text-sm"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
            onBlur={() => setInput(String(page))}
            inputMode="numeric"
            aria-label={t.goTo}
            className="w-12 rounded-md border border-white/20 bg-white/10 px-1.5 py-1 text-center tabular-nums text-white focus:border-gold focus:outline-none"
          />
          <span className="whitespace-nowrap tabular-nums text-white/70">{fill(t.of, { n: numPages || "…" })}</span>
        </form>
        <button type="button" onClick={() => goTo(page + 1)} disabled={!doc || page >= numPages} aria-label={t.next} title={t.next} className={btn}>
          <Icon d="M6 9l6 6 6-6" />
        </button>
        <span className="mx-1 hidden h-6 w-px bg-white/15 sm:block" />
        <button type="button" onClick={() => zoomBy(-1)} disabled={zoom <= ZOOMS[0]} aria-label={t.zoomOut} title={t.zoomOut} className={btn}>
          <Icon d="M5 12h14" />
        </button>
        <button
          type="button"
          onClick={() => setZoomKeep(1)}
          title={t.fit}
          className="hidden h-9 rounded-lg px-2 text-xs font-semibold tabular-nums text-white/85 hover:bg-white/10 sm:block"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={() => zoomBy(1)} disabled={zoom >= ZOOMS[ZOOMS.length - 1]} aria-label={t.zoomIn} title={t.zoomIn} className={btn}>
          <Icon d="M12 5v14M5 12h14" />
        </button>
        {canFull && (
          <button type="button" onClick={toggleFull} aria-label={full ? t.exitFullscreen : t.fullscreen} title={full ? t.exitFullscreen : t.fullscreen} className={btn}>
            <Icon d={full ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"} />
          </button>
        )}
      </div>

      {resume && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gold-soft px-3 py-2 text-sm text-gold-deep">
          <span className="font-semibold">{fill(t.resume, { n: resume })}</span>
          <button
            type="button"
            onClick={() => {
              goTo(resume);
              setResume(null);
            }}
            className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-[#241703] hover:bg-[#eba53c]"
          >
            {t.resumeGo}
          </button>
          <button type="button" onClick={() => setResume(null)} aria-label="×" className="px-1 text-lg leading-none opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Pages */}
      <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 overflow-auto overscroll-contain">
        {failed ? (
          <div className="mx-auto max-w-md p-8 text-center text-white">
            <p className="mb-4">{t.error}</p>
            <a href={url} download className="inline-block rounded-full bg-gold px-5 py-2.5 font-bold text-[#241703]">
              ⬇ PDF
            </a>
          </div>
        ) : !doc || !width ? (
          <div className="grid h-full place-items-center text-white/80">
            <div className="text-center">
              <span className="mx-auto mb-3 block size-10 animate-spin rounded-full border-4 border-white/20 border-t-gold" />
              <p className="text-sm">{t.loading}</p>
              {progress > 0 && <p className="mt-1 text-xs tabular-nums text-white/60">{fill(t.progress, { n: progress })}</p>}
            </div>
          </div>
        ) : (
          <div className="relative mx-auto py-3" style={{ width: Math.max(pageWidth, 0), height: numPages * step + 12 }}>
            {Array.from({ length: numPages }, (_, i) => i + 1)
              // Only pages near the one being read are mounted; the rest are empty space.
              .filter((n) => Math.abs(n - page) <= 3)
              .map((n) => (
                <PdfPage key={n} doc={doc} n={n} width={pageWidth} height={pageHeight} top={(n - 1) * step + 12} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PdfPage({ doc, n, width, height, top }: { doc: PDFDocumentProxy; n: number; width: number; height: number; top: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    let task: RenderTask | null = null;
    let alive = true;
    doc.getPage(n).then((p) => {
      const canvas = canvasRef.current;
      if (!alive || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const base = p.getViewport({ scale: 1 });
      const viewport = p.getViewport({ scale: (width / base.width) * dpr });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      task = p.render({ canvas, viewport });
      task.promise.then(() => alive && setDrawn(true)).catch(() => {});
    });
    return () => {
      alive = false;
      task?.cancel();
    };
  }, [doc, n, width]);

  return (
    <div className="absolute left-0 overflow-hidden rounded-sm bg-white shadow-lg" style={{ top, width, height }} data-page={n}>
      {!drawn && <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-400">{n}</span>}
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
