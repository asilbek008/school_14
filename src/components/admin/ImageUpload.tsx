"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // matches the "media" bucket limit

/**
 * Uploads straight from the browser to the Supabase "media" bucket (RLS: admins only), then
 * stores the object path in a hidden input. This avoids the Server Action body-size limit.
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
    if (file.size > MAX_BYTES) return setStatus("Rasm 5 MB dan katta bo‘lmasin.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return setStatus("Faqat JPG, PNG yoki WebP rasm yuklash mumkin.");
    }
    setStatus("Yuklanmoqda…");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const objectPath = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from("media").upload(objectPath, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });
    if (error) return setStatus(`Yuklab bo‘lmadi: ${error.message}`);
    setPath(objectPath);
    setStatus(null);
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
          accept="image/jpeg,image/png,image/webp"
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
