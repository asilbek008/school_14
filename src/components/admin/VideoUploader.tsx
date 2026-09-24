"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_MB = 50;
const types: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

/** Uploads video files (MP4 / WebM / MOV, up to 50 MB each) into `folder`, then registers them. */
export default function VideoUploader({ folder, onUploaded }: { folder: string; onUploaded: (paths: string[]) => Promise<void> }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(files: FileList) {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    const supabase = createClient();
    const paths: string[] = [];
    const problems: string[] = [];
    for (const [i, file] of list.entries()) {
      const ext = types[file.type];
      if (!ext) {
        problems.push(`${file.name}: format qo‘llab-quvvatlanmaydi (MP4, WebM yoki MOV bo‘lsin)`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        problems.push(`${file.name}: ${MAX_MB} MB dan katta — YouTube’ga joylab, havolasini qo‘shing`);
        continue;
      }
      setStatus(`Yuklanmoqda: ${i + 1} / ${list.length} (${Math.round(file.size / 1024 / 1024)} MB)…`);
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (error) problems.push(`${file.name}: ${error.message}`);
      else paths.push(path);
    }
    if (paths.length) await onUploaded(paths);
    setBusy(false);
    setStatus([paths.length ? `${paths.length} ta video qo‘shildi.` : "", ...problems].filter(Boolean).join(" · "));
    router.refresh();
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
      <label className={`inline-block cursor-pointer rounded-lg px-5 py-2.5 font-semibold text-white ${busy ? "bg-slate-400" : "bg-blue-700 hover:bg-blue-800"}`}>
        {busy ? "Yuklanmoqda…" : "+ Video fayl tanlash"}
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          multiple
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) handle(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <p className="mt-2 text-sm text-slate-500">MP4, WebM yoki MOV, har biri {MAX_MB} MB gacha. Kattaroq videoni YouTube’ga joylab, havolasini qo‘shing.</p>
      {status && <p role="status" className="mt-2 text-sm font-medium text-slate-700">{status}</p>}
    </div>
  );
}
