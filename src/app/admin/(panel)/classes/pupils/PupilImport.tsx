"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { readPupilFile, type ParsedPupils } from "@/lib/pupil-import";
import { importPupils, type PupilImportResult } from "../actions";

const order = (a: string, b: string) => parseInt(a) - parseInt(b) || (a < b ? -1 : a > b ? 1 : 0);

/** Pick eMaktab's file → per-class preview (counts only) → save. */
export default function PupilImport({ classes }: { classes: string[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedPupils | null>(null);
  const [result, setResult] = useState<PupilImportResult | null>(null);
  const [saving, startSaving] = useTransition();
  const known = new Set(classes);

  async function choose(f: File) {
    setFile(f);
    setResult(null);
    setParsed(await readPupilFile(f));
  }

  function save() {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    startSaving(async () => {
      setResult(await importPupils(form));
      setParsed(null);
      setFile(null);
    });
  }

  const rows = parsed?.rows ?? [];
  const groups = [...new Set(rows.map((r) => r.cls))].sort(order).map((cls) => {
    const list = rows.filter((r) => r.cls === cls);
    return { cls, n: list.length, boys: list.filter((r) => r.gender === "m").length, girls: list.filter((r) => r.gender === "f").length };
  });
  const unknown = groups.filter((g) => !known.has(g.cls)).map((g) => g.cls);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
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
        <p className="mt-2 text-sm text-slate-500">{file ? file.name : "Faqat .xlsx"}</p>
      </div>

      {result && (
        <div role="status" className={`rounded-xl p-5 ${result.error || result.errors ? "bg-red-50 text-red-800" : "bg-green-50 text-green-900"}`}>
          {result.error && <p className="font-semibold">{result.error}</p>}
          {result.errors && <Errors title="Hech narsa saqlanmadi:" items={result.errors} />}
          {result.saved != null && (
            <>
              <p className="font-semibold">✓ Saqlandi: {result.saved} ta o‘quvchi. Sinflardagi o‘quvchilar soni yangilandi.</p>
              <Link href="/admin/classes" className="mt-3 inline-block font-semibold text-blue-700 hover:underline">
                Sinflar ro‘yxatiga o‘tish →
              </Link>
            </>
          )}
        </div>
      )}

      {parsed && (
        <div className="space-y-4">
          {parsed.errors.length > 0 && (
            <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">
              <Errors title="Faylni tuzating va qayta tanlang:" items={parsed.errors} />
            </div>
          )}
          {unknown.length > 0 && (
            <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Saytda bunday sinf yo‘q: <b>{unknown.join(", ")}</b>. Avval «Sinflar» bo‘limida qo‘shing.
            </p>
          )}
          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-slate-700">
                  <b>{rows.length}</b> ta o‘quvchi, <b>{groups.length}</b> ta sinf · o‘g‘il {rows.filter((r) => r.gender === "m").length}, qiz{" "}
                  {rows.filter((r) => r.gender === "f").length}
                </p>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || parsed.errors.length > 0 || unknown.length > 0}
                  className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400"
                >
                  {saving ? "Saqlanmoqda…" : "Saqlash"}
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {groups.map((g) => (
                  <li key={g.cls} className={`rounded-xl bg-white p-3 shadow-sm ${known.has(g.cls) ? "" : "ring-2 ring-amber-400"}`}>
                    <b className="block text-lg text-slate-900">{g.cls}</b>
                    <span className="text-sm text-slate-600">{g.n} ta</span>
                    <span className="block text-xs text-slate-500">
                      o‘g‘il {g.boys} · qiz {g.girls}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Errors({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.slice(0, 30).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
