"use client";

import { useState } from "react";
import PhotoUploader from "./PhotoUploader";

/** Photo upload with a choice of the league round ("tur") the photos belong to, or the program in general. */
export default function RoundPhotoUploader({
  folder,
  rounds,
  onUploaded,
}: {
  folder: string;
  /** Rounds to offer (played so far and the next one). */
  rounds: number[];
  onUploaded: (paths: string[], round: number | null) => Promise<void>;
}) {
  const [round, setRound] = useState<number | null>(rounds.at(-2) ?? rounds.at(-1) ?? null);
  return (
    <div>
      <label className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
        Qaysi tur rasmlari:
        <select
          value={round ?? ""}
          onChange={(e) => setRound(e.target.value ? Number(e.target.value) : null)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-normal"
        >
          {rounds.map((r) => (
            <option key={r} value={r}>
              {r}-tur
            </option>
          ))}
          <option value="">Umumiy (turga bog‘liq emas)</option>
        </select>
      </label>
      <PhotoUploader folder={folder} onUploaded={(paths) => onUploaded(paths, round)} />
    </div>
  );
}
