"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mediaBaseUrl } from "@/lib/media";
import ImageUpload from "./ImageUpload";
import { Field, inputClass } from "./fields";

const MAX_MB = 50;
const types: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

/**
 * Where a video comes from: YouTube (the first choice — free, and it streams at whatever quality the
 * phone's connection carries) or a file in the media bucket, which the bucket caps at 50 MB. Only the
 * chosen source's fields are shown; the file goes from the browser straight to the bucket and reaches
 * the Server Action as a hidden path.
 */
export default function VideoSource({
  initial,
}: {
  initial: { kind: "youtube" | "file"; path: string; cover: string | null };
}) {
  const [kind, setKind] = useState(initial.kind);
  const [path, setPath] = useState(initial.kind === "file" ? initial.path : "");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    const ext = types[file.type];
    if (!ext) return setStatus("Format qo‘llab-quvvatlanmaydi: MP4, WebM yoki MOV bo‘lsin.");
    if (file.size > MAX_MB * 1024 * 1024) {
      return setStatus(`Fayl ${(file.size / 1024 / 1024).toFixed(1)} MB — ${MAX_MB} MB dan katta. Videoni YouTube’ga joylab, havolasini qo‘ying.`);
    }
    setBusy(true);
    setStatus(`Yuklanmoqda… (${Math.round(file.size / 1024 / 1024)} MB)`);
    const next = `videos/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from("media").upload(next, file, { contentType: file.type, cacheControl: "31536000" });
    setBusy(false);
    if (error) return setStatus(`Yuklab bo‘lmadi: ${error.message}`);
    setPath(next);
    setStatus(`${file.name} yuklandi.`);
  }

  const tab = (value: "youtube" | "file", label: string) => (
    <button
      type="button"
      onClick={() => setKind(value)}
      aria-pressed={kind === value}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
        kind === value ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-wrap gap-2">
        {tab("youtube", "YouTube havolasi")}
        {tab("file", "Video fayl")}
      </div>

      {kind === "youtube" ? (
        <Field label="YouTube havolasi" hint="Masalan: https://youtu.be/xxxxxxxxxxx — Shorts va to‘liq havola ham bo‘ladi.">
          <input
            name="youtube"
            defaultValue={initial.kind === "youtube" ? initial.path : ""}
            placeholder="https://youtu.be/…"
            className={inputClass}
          />
        </Field>
      ) : (
        <>
          <input type="hidden" name="path" value={path} />
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
            <label className={`inline-block cursor-pointer rounded-lg px-5 py-2.5 font-semibold text-white ${busy ? "bg-slate-400" : "bg-blue-700 hover:bg-blue-800"}`}>
              {busy ? "Yuklanmoqda…" : path ? "Boshqa fayl tanlash" : "+ Video fayl tanlash"}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                disabled={busy}
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.[0]) upload(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="mt-2 text-sm text-slate-500">MP4, WebM yoki MOV, {MAX_MB} MB gacha.</p>
            {status && <p role="status" className="mt-2 text-sm font-medium text-slate-700">{status}</p>}
            {path && <video src={`${mediaBaseUrl}/${path}`} controls preload="metadata" className="mx-auto mt-3 aspect-video w-full max-w-md rounded-lg bg-slate-900" />}
          </div>
          <Field label="Muqova rasmi" hint="Ixtiyoriy: video ochilmasidan oldin ko‘rinadigan rasm.">
            <ImageUpload name="cover" folder="videos/covers" initialPath={initial.cover} publicBaseUrl={mediaBaseUrl} />
          </Field>
        </>
      )}
    </div>
  );
}
