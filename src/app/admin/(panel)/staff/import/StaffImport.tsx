"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { normalizeName, readStaffFile, type ParsedStaffSheet } from "@/lib/staff-import";
import { importStaff, type ImportResult } from "../actions";

/** Pick the Excel file → preview what will change → save. */
export default function StaffImport({ existing }: { existing: { full: string[]; short: string[] } }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedStaffSheet | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [saving, startSaving] = useTransition();

  const full = new Set(existing.full.map(normalizeName));
  const short = new Set(existing.short.map(normalizeName));
  const isUpdate = (row: ParsedStaffSheet["rows"][number]) =>
    (row.short_name != null && short.has(normalizeName(row.short_name))) || full.has(normalizeName(row.full_name));

  async function choose(f: File) {
    setFile(f);
    setResult(null);
    setParsed(await readStaffFile(f));
  }

  function save() {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    startSaving(async () => {
      setResult(await importStaff(form));
      setParsed(null);
      setFile(null);
    });
  }

  const rows = parsed?.rows ?? [];
  const updates = rows.filter(isUpdate).length;

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
        <p className="mt-2 text-sm text-slate-500">
          {file ? file.name : "Faqat .xlsx. Eski .xls bo‘lsa, Excel'da «Saqlash sifatida» → .xlsx qiling."}
        </p>
      </div>

      {result && (
        <div role="status" className={`rounded-xl p-5 ${result.error || result.errors ? "bg-red-50 text-red-800" : "bg-green-50 text-green-900"}`}>
          {result.error && <p className="font-semibold">{result.error}</p>}
          {result.errors && <ErrorList title="Faylda xato bor — hech narsa saqlanmadi:" items={result.errors} />}
          {result.added != null && (
            <>
              <p className="font-semibold">
                Saqlandi: {result.added} ta yangi, {result.updated} ta yangilandi, {result.homerooms} ta sinf rahbari yozildi.
              </p>
              {!!result.warnings?.length && <ErrorList title="Quyidagilar o‘tkazib yuborildi:" items={result.warnings} />}
              <Link href="/admin/staff" className="mt-3 inline-block font-semibold text-blue-700 hover:underline">
                O‘qituvchilar ro‘yxatiga o‘tish →
              </Link>
            </>
          )}
        </div>
      )}

      {parsed && (
        <div className="space-y-4">
          {parsed.errors.length > 0 && (
            <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">
              <ErrorList title="Faylni tuzating va qayta tanlang:" items={parsed.errors} />
            </div>
          )}
          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-slate-700">
                  <b>{rows.length}</b> ta xodim: <b>{rows.length - updates}</b> ta yangi, <b>{updates}</b> ta yangilanadi.
                  Bo‘sh kataklar eski ma’lumotni o‘chirmaydi.
                </p>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || parsed.errors.length > 0}
                  className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400"
                >
                  {saving ? "Saqlanmoqda…" : "Saqlash"}
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Qator</th>
                      <th className="px-3 py-2">Ism-familiya</th>
                      <th className="px-3 py-2">eMaktab</th>
                      <th className="px-3 py-2">Lavozimi</th>
                      <th className="px-3 py-2">Fani</th>
                      <th className="px-3 py-2">Sinf rahbari</th>
                      <th className="px-3 py-2">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                      <tr key={row.line}>
                        <td className="px-3 py-2 text-slate-400">{row.line}</td>
                        <td className="px-3 py-2 font-medium">{row.full_name}</td>
                        <td className="px-3 py-2 text-slate-500">{row.short_name}</td>
                        <td className="px-3 py-2">{row.position_uz}</td>
                        <td className="px-3 py-2">{row.subject_uz}</td>
                        <td className="px-3 py-2">{row.homeroom.join(", ")}</td>
                        <td className="px-3 py-2">
                          {isUpdate(row) ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">yangilanadi</span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">yangi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorList({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
