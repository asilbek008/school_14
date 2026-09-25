"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mediaBaseUrl } from "@/lib/media";
import { pdfCover } from "@/lib/pdf";
import { uploadImage } from "@/lib/resize-image";

const MAX_MB = 50;
const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * A library book's PDF and cover. The PDF goes straight from the browser to the media bucket; its first
 * page is drawn into a JPEG cover and its pages are counted on the way (PDF.js), unless the admin
 * already has a cover. The cover can also be redrawn or replaced by any picture. Values reach the
 * Server Action through hidden inputs (path, file_size, pages, cover).
 */
export default function BookFileField({
  initial,
}: {
  initial: { path: string | null; size: number | null; pages: number | null; cover: string | null };
}) {
  const [path, setPath] = useState(initial.path ?? "");
  const [size, setSize] = useState(initial.size ?? 0);
  const [pages, setPages] = useState(initial.pages ?? 0);
  const [cover, setCover] = useState(initial.cover ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);

  async function coverFrom(file: File) {
    const { cover: blob, pages: count } = await pdfCover(file);
    setPages(count);
    if (!blob) return;
    const next = `library/covers/${crypto.randomUUID()}.jpg`;
    const { error } = await createClient().storage.from("media").upload(next, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (!error) setCover(next);
  }

  async function upload(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return setStatus("Faqat PDF fayl yuklash mumkin.");
    if (file.size > MAX_MB * 1024 * 1024) {
      return setStatus(`Fayl ${mb(file.size)} — ${MAX_MB} MB dan katta. Uni boshqa saytga joylab, pastdagi «Havola» maydoniga manzilini yozing.`);
    }
    setBusy(true);
    setStatus(`Yuklanmoqda… (${mb(file.size)})`);
    const next = `library/${crypto.randomUUID()}.pdf`;
    const { error } = await createClient().storage.from("media").upload(next, file, { contentType: "application/pdf", cacheControl: "31536000" });
    if (error) {
      setBusy(false);
      return setStatus(`Yuklab bo‘lmadi: ${error.message}`);
    }
    setPath(next);
    setSize(file.size);
    setLastFile(file);
    setStatus("Muqova va sahifalar soni tayyorlanmoqda…");
    try {
      if (!cover) await coverFrom(file);
      else setPages((await pdfCover(file, 60)).pages);
      setStatus(`${file.name} yuklandi.`);
    } catch (e) {
      console.error("PDF cover", e);
      setStatus(`${file.name} yuklandi (muqovani avtomatik chizib bo‘lmadi — rasmini o‘zingiz yuklang).`);
    }
    setBusy(false);
  }

  async function redraw() {
    if (!lastFile) return;
    setBusy(true);
    try {
      await coverFrom(lastFile);
    } catch {
      setStatus("Muqovani chizib bo‘lmadi.");
    }
    setBusy(false);
  }

  async function ownCover(file: File) {
    setBusy(true);
    try {
      setCover(await uploadImage(createClient(), "library/covers", file));
    } catch (e) {
      setStatus(`Rasmni yuklab bo‘lmadi: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
      <input type="hidden" name="path" value={path} />
      <input type="hidden" name="file_size" value={size || ""} />
      <input type="hidden" name="pages" value={pages || ""} />
      <input type="hidden" name="cover" value={cover} />

      <div>
        <div className="grid aspect-[3/4] w-[160px] place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={`${mediaBaseUrl}/${cover}`} alt="Muqova" className="size-full object-cover" />
          ) : (
            <span className="p-3">Muqova PDF yuklanganda 1-sahifadan chiziladi</span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-1 text-xs">
          <label className="cursor-pointer font-semibold text-blue-700 hover:underline">
            Boshqa rasm tanlash
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                if (e.target.files?.[0]) ownCover(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
          {lastFile && (
            <button type="button" onClick={redraw} disabled={busy} className="text-left font-semibold text-blue-700 hover:underline disabled:opacity-50">
              1-sahifadan qayta chizish
            </button>
          )}
          {cover && (
            <button type="button" onClick={() => setCover("")} className="text-left text-red-700 hover:underline">
              Muqovani olib tashlash
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label className={`inline-block cursor-pointer rounded-lg px-5 py-2.5 font-semibold text-white ${busy ? "bg-slate-400" : "bg-blue-700 hover:bg-blue-800"}`}>
          {path ? "Boshqa PDF tanlash" : "PDF faylni tanlash"}
          <input
            type="file"
            accept=".pdf,application/pdf"
            disabled={busy}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.[0]) upload(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
        {path && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-slate-700">
              📄 {size ? mb(size) : "PDF"}
              {pages ? ` · ${pages} sahifa` : ""}
            </span>
            <a href={`${mediaBaseUrl}/${path}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 hover:underline">
              Ochish ↗
            </a>
            <button
              type="button"
              onClick={() => {
                setPath("");
                setSize(0);
                setPages(0);
              }}
              className="text-red-700 hover:underline"
            >
              Faylni olib tashlash
            </button>
          </p>
        )}
        {status && <p className="text-sm text-slate-600">{status}</p>}
        <p className="text-xs text-slate-500">
          {MAX_MB} MB gacha. Kattaroq kitobni PDF siqish dasturi (masalan, «Compress PDF») bilan kichraytiring yoki pastda havola bering.
        </p>
      </div>
    </div>
  );
}
