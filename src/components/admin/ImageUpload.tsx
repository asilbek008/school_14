"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/resize-image";

/**
 * Uploads straight from the browser to the Supabase "media" bucket (RLS: admins only), then
 * stores the object path in a hidden input. This avoids the Server Action body-size limit.
 * Photos are shrunk in the browser first (see resize-image.ts).
 */
export default function ImageUpload({
  name,
  folder,
  initialPath,
  publicBaseUrl,
}: {
  name: string;
  folder: string;
  initialPath: string | null;
  publicBaseUrl: string;
}) {
  const [path, setPath] = useState(initialPath ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const preview = path ? (/^https?:\/\//.test(path) ? path : `${publicBaseUrl}/${path}`) : null;

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return setStatus("Faqat rasm fayl yuklash mumkin.");
    setStatus("Yuklanmoqda…");
    try {
      setPath(await uploadImage(createClient(), folder, file));
      setStatus(null);
    } catch (e) {
      setStatus(`Yuklab bo‘lmadi: ${e instanceof Error ? e.message : "noma’lum xato"}`);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <input type="hidden" name={name} value={path} />
      <div className="size-28 overflow-hidden rounded-lg bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a just-uploaded file */}
        {preview && <img src={preview} alt="" className="size-full object-cover" />}
      </div>
      <div className="space-y-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          className="block text-sm"
        />
        {path && (
          <button type="button" onClick={() => setPath("")} className="text-sm text-red-700 hover:underline">
            Rasmni olib tashlash
          </button>
        )}
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </div>
    </div>
  );
}
