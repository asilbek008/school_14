"use client";

import { useState, useTransition } from "react";

export type PhotoItem = { id: number; path: string; url: string };

/**
 * Photos in their site order. Drag a photo (or use the arrows, on phones and with the keyboard) to
 * change the order — it is saved right away; delete a photo, and (when `setCover` is given) choose the
 * cover. Without a chosen cover the first photo is the cover.
 */
export default function PhotoManager({
  items,
  cover,
  reorder,
  setCover,
  remove,
}: {
  items: PhotoItem[];
  cover?: string | null;
  reorder: (ids: number[]) => Promise<void>;
  setCover?: (path: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}) {
  const [list, setList] = useState(items);
  const [committed, setCommitted] = useState(items); // the saved order, to go back to if a drag is dropped outside
  const [shown, setShown] = useState(items);
  const [dragId, setDragId] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();
  const [busy, startBusy] = useTransition();
  const [saved, setSaved] = useState(false);

  // New photos uploaded or one deleted: take the list from the server again.
  if (items !== shown) {
    setShown(items);
    setList(items);
    setCommitted(items);
  }

  const commit = (next: PhotoItem[]) => {
    setList(next);
    setCommitted(next);
    setSaved(false);
    startSaving(async () => {
      await reorder(next.map((p) => p.id));
      setSaved(true);
    });
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    next.splice(to, 0, ...next.splice(from, 1));
    commit(next);
  };
  // No cover chosen: the site uses the first photo.
  const coverPath = setCover ? (cover ?? list[0]?.path) : null;

  if (!list.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-3 flex flex-wrap items-center gap-x-2 text-sm text-slate-500" role="status">
        <span aria-hidden>⠿</span> Saytda shu tartibda chiqadi. Tartibni o‘zgartirish uchun rasmni sudrang yoki ← → tugmalarini bosing.
        {saving && <span className="font-medium text-blue-700">Saqlanmoqda…</span>}
        {saved && !saving && <span className="font-medium text-green-700">Tartib saqlandi ✓</span>}
      </p>
      <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${busy ? "opacity-70" : ""}`}>
        {list.map((photo, i) => {
          const isCover = photo.path === coverPath;
          return (
            <li
              key={photo.id}
              draggable
              onDragStart={(e) => {
                setDragId(photo.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                // Still set means it was not dropped on a photo: undo the live preview.
                if (dragId !== null) setList(committed);
                setDragId(null);
              }}
              onDragOver={(e) => {
                if (dragId === null) return;
                e.preventDefault();
                const from = list.findIndex((p) => p.id === dragId);
                if (from !== i) {
                  const next = [...list];
                  next.splice(i, 0, ...next.splice(from, 1));
                  setList(next);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId !== null) commit(list);
                setDragId(null);
              }}
              className={`group relative cursor-grab overflow-hidden rounded-xl bg-white shadow-sm transition active:cursor-grabbing ${
                isCover ? "ring-3 ring-blue-600" : ""
              } ${dragId === photo.id ? "opacity-50" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img src={photo.url} alt="" loading="lazy" draggable={false} className="aspect-square w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-bold text-white">{i + 1}</span>
              {isCover && <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">Muqova</span>}
              <div className="flex items-center justify-between gap-1 px-2 py-2 text-sm">
                <div className="flex">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`${i + 1}-rasm: oldinga`} className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} aria-label={`${i + 1}-rasm: keyinga`} className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    →
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {setCover && !isCover && (
                    <button type="button" disabled={busy} onClick={() => startBusy(() => setCover(photo.path))} className="text-blue-700 hover:underline">
                      Muqova
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirm("Bu rasmni o‘chirasizmi?") && startBusy(() => remove(photo.id))}
                    className="text-red-700 hover:underline"
                  >
                    O‘chirish
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
