"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Status from "@/components/admin/Status";
import { reorderClubs } from "./actions";

export type ClubItem = {
  id: number;
  name: string;
  grades: string | null;
  schedule: string | null;
  leader: string | null;
  cover: string | null;
  photos: number;
  videos: number;
  published: boolean;
};

const tints = ["bg-blue-100 text-blue-800", "bg-teal-100 text-teal-800", "bg-amber-100 text-amber-800"];

/**
 * The clubs in their site order. Drag a row by its handle (or use the arrows, on phones and with the
 * keyboard) to change the order; it is saved right away.
 */
export default function ClubList({ items }: { items: ClubItem[] }) {
  const [list, setList] = useState(items);
  const [committed, setCommitted] = useState(items); // the saved order, to go back to if a drag is dropped outside
  const [dragId, setDragId] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const commit = (next: ClubItem[]) => {
    setList(next);
    setCommitted(next);
    setSaved(false);
    startSaving(async () => {
      await reorderClubs(next.map((c) => c.id));
      setSaved(true);
    });
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    next.splice(to, 0, ...next.splice(from, 1));
    commit(next);
  };

  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm text-slate-500" role="status">
        <span aria-hidden>⠿</span> Tartibni o‘zgartirish uchun qatorni chapdagi tutqichdan sudrang yoki ↑ ↓ tugmalarini bosing.
        {saving && <span className="font-medium text-blue-700">Saqlanmoqda…</span>}
        {saved && !saving && <span className="font-medium text-green-700">Tartib saqlandi ✓</span>}
      </p>
      <ul className="space-y-2.5">
        {list.map((club, i) => (
          <li
            key={club.id}
            onDragOver={(e) => {
              if (dragId === null) return;
              e.preventDefault();
              const from = list.findIndex((c) => c.id === dragId);
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
            className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition sm:gap-4 sm:p-4 ${
              dragId === club.id ? "border-blue-400 opacity-60" : "border-slate-200"
            }`}
          >
            <span
              draggable
              onDragStart={(e) => {
                setDragId(club.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                // Still set means it was not dropped on a row: undo the live preview.
                if (dragId !== null) setList(committed);
                setDragId(null);
              }}
              title="Sudrab tartibini o‘zgartiring"
              className="hidden cursor-grab select-none px-1 text-xl leading-none text-slate-400 hover:text-slate-600 active:cursor-grabbing sm:block"
              aria-hidden
            >
              ⠿
            </span>
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`${club.name}: yuqoriga`} className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                ↑
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} aria-label={`${club.name}: pastga`} className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                ↓
              </button>
            </div>
            {club.cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
              <img src={club.cover} alt="" className="size-14 shrink-0 rounded-lg object-cover sm:size-16" />
            ) : (
              <span className={`grid size-14 shrink-0 place-items-center rounded-lg text-xl font-bold sm:size-16 ${tints[club.id % tints.length]}`}>
                {club.name.charAt(0)}
              </span>
            )}
            <Link href={`/admin/clubs/${club.id}`} className="group min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900 group-hover:text-blue-700">{club.name}</p>
              <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate-500">
                {club.grades && <span>{club.grades}</span>}
                {club.schedule && <span>🕒 {club.schedule}</span>}
                {club.leader && <span>👤 {club.leader}</span>}
                {(club.photos > 0 || club.videos > 0) && (
                  <span>
                    {club.photos > 0 && `📷 ${club.photos}`} {club.videos > 0 && `🎬 ${club.videos}`}
                  </span>
                )}
                {!club.schedule && !club.leader && <span className="text-amber-700">Vaqti va rahbari kiritilmagan</span>}
              </p>
            </Link>
            <Status published={club.published} />
          </li>
        ))}
      </ul>
    </div>
  );
}
