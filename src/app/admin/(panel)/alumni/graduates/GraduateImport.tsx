"use client";

import { useState, useTransition } from "react";
import { graduatingRows, readPupilFile, type PupilRow } from "@/lib/pupil-import";
import { importGraduates, type GraduateImportResult } from "../actions";

/** Year + eMaktab file → per-class preview (counts only) → save. */
export default function GraduateImport({ current }: { current: number }) {
  const [year, setYear] = useState(current);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<PupilRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<GraduateImportResult | null>(null);
  const [saving, startSaving] = useTransition();
  const years = Array.from({ length: current - 1976 + 1 }, (_, i) => current - i);

  async function choose(f: File) {
    setFile(f);
    setResult(null);
    const parsed = await readPupilFile(f);
    setErrors(parsed.errors);
    setRows(graduatingRows(parsed.rows));
  }

  function save() {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    form.set("year", String(year));
    startSaving(async () => {
      setResult(await importGraduates(form));
      setRows(null);
      setFile(null);
    });
  }

  const classes = rows ? [...new Set(rows.map((r) => r.cls))].sort() : [];

  return (
    <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-semibold text-slate-700">
          Bitiruv yili
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}-yil
              </option>
            ))}
          </select>
        </label>
        <label className={`inline-block cursor-pointer rounded-lg px-5 py-2.5 font-semibold text-white ${saving ? "bg-slate-400" : "bg-blue-700 hover:bg-blue-800"}`}>
          {file ? "Boshqa fayl tanlash" : "Excel faylni tanlash"}
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={saving}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) choose(f);
              e.target.value = "";
            }}
          />
        </label>
        {file && <span className="text-sm text-slate-500">{file.name}</span>}
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="list-disc rounded-lg bg-red-50 p-4 pl-8 text-sm text-red-800">
          {errors.slice(0, 20).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {rows && rows.length > 0 && errors.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
          <p className="text-slate-700">
            <b>{year}-yil</b>: <b>{rows.length}</b> ta bitiruvchi · {classes.join(", ")} · o‘g‘il {rows.filter((r) => r.gender === "m").length}, qiz{" "}
            {rows.filter((r) => r.gender === "f").length}
          </p>
          <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400">
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </div>
      )}
      {result && (
        <p role="status" className={`rounded-lg p-4 text-sm font-semibold ${result.saved != null ? "bg-green-50 text-green-900" : "bg-red-50 text-red-800"}`}>
          {result.saved != null ? `✓ Saqlandi: ${result.saved} ta bitiruvchi.` : (result.error ?? result.errors?.join("; "))}
        </p>
      )}
    </div>
  );
}
