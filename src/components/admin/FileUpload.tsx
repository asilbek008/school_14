"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_MB = 50;
// What the media bucket accepts for documents.
const types: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

/**
 * Uploads a document (PDF, Word or Excel) straight from the browser to the "media" bucket
 * (RLS: admins only) and keeps its path and size in hidden inputs, so the Server Action never
 * carries the file itself.
 */
export default function FileUpload({
  name,
  sizeName,
  folder,
  initialPath,
  initialSize,
  publicBaseUrl,
}: {
  name: string;
  sizeName: string;
  folder: string;
  initialPath: string | null;
  initialSize: number | null;
  publicBaseUrl: string;
}) {
  const [path, setPath] = useState(initialPath ?? "");
  const [size, setSize] = useState(initialSize ?? 0);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    const ext = types[file.type] ?? (file.name.toLowerCase().endsWith(".pdf") ? "pdf" : null);
    if (!ext) return setStatus("Faqat PDF, Word yoki Excel fayl yuklash mumkin.");
    if (file.size > MAX_MB * 1024 * 1024) return setStatus(`Fayl ${MAX_MB} MB dan katta.`);
    setBusy(true);
    setStatus("Yuklanmoqda…");
    const supabase = createClient();
    const next = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(next, file, { contentType: file.type, cacheControl: "31536000" });
    setBusy(false);
    if (error) return setStatus(`Yuklab bo‘lmadi: ${error.message}`);
    setPath(next);
    setSize(file.size);
    setStatus(`${file.name} yuklandi.`);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={path} />
      <input type="hidden" name={sizeName} value={size || ""} />
      <input
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
        disabled={busy}
        onChange={(e) => {
          if (e.target.files?.[0]) upload(e.target.files[0]);
          e.target.value = "";
        }}
        className="block text-sm"
      />
      {path && (
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <a href={`${publicBaseUrl}/${path}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 hover:underline">
            Yuklangan faylni ochish ↗
          </a>
          <button type="button" onClick={() => { setPath(""); setSize(0); }} className="text-red-700 hover:underline">
            Faylni olib tashlash
          </button>
        </p>
      )}
      {status && <p className="text-sm text-slate-600">{status}</p>}
      <p className="text-xs text-slate-500">PDF, Word yoki Excel, {MAX_MB} MB gacha. Fayl o‘rniga havola ham qo‘shish mumkin.</p>
    </div>
  );
}
