"use client";

// PDF.js, loaded on demand (it is large) with its worker next to it. The legacy build: the modern one
// needs JS features older phones lack (Map.getOrInsertComputed). Used by the library reader and, in the
// admin panel, to count a book's pages and draw its cover from the first page.

import type * as Pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

let lib: Promise<typeof Pdfjs> | null = null;

export function loadPdfjs(): Promise<typeof Pdfjs> {
  lib ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    return m;
  });
  return lib;
}

/**
 * Opens a PDF by URL. Only the pages being read are fetched (HTTP range requests), so a 40 MB textbook
 * opens quickly on a phone.
 */
export async function openPdf(url: string, onProgress?: (percent: number) => void) {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ url, disableAutoFetch: true, disableStream: true, rangeChunkSize: 262144 });
  if (onProgress) {
    task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (total) onProgress(Math.min(100, Math.round((loaded / total) * 100)));
    };
  }
  return task.promise;
}

/** First page of a local PDF file as a JPEG (for a book's cover), and its page count. */
export async function pdfCover(file: File, width = 600): Promise<{ cover: Blob | null; pages: number }> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    const cover = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return { cover, pages: doc.numPages };
  } finally {
    await doc.loadingTask.destroy();
  }
}
