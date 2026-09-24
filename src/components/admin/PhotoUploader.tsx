"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/resize-image";

/** Uploads many photos (shrunk in the browser) into `folder` (e.g. gallery/12), then registers them. */
export default function PhotoUploader({
  folder,
  onUploaded,
}: {
  folder: string;
  onUploaded: (paths: string[]) => Promise<void>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!list.length) return;
    setBusy(true);
    const supabase = createClient();
    const paths: string[] = [];
    let failed = 0;
    for (const [i, file] of list.entries()) {
      setStatus(`Yuklanmoqda: ${i + 1} / ${list.length}…`);
      try {
        paths.push(await uploadImage(supabase, folder, file));
      } catch {
        failed++;
      }
    }
    if (paths.length) await onUploaded(paths);
    setBusy(false);
    setStatus(
      failed
        ? `${paths.length} ta rasm qo‘shildi, ${failed} tasini yuklab bo‘lmadi (format qo‘llab-quvvatlanmasligi mumkin).`
        : `${paths.length} ta rasm qo‘shildi.`,
    );
    router.refresh();
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
      <label className={`inline-block cursor-pointer rounded-lg px-5 py-2.5 font-semibold text-white ${busy ? "bg-slate-400" : "bg-blue-700 hover:bg-blue-800"}`}>
        {busy ? "Yuklanmoqda…" : "+ Rasmlarni tanlash"}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) handle(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <p className="mt-2 text-sm text-slate-500">Bir nechta rasmni birga tanlash mumkin. Katta rasmlar avtomatik kichraytiriladi.</p>
      {status && <p role="status" className="mt-2 text-sm font-medium text-slate-700">{status}</p>}
    </div>
  );
}
