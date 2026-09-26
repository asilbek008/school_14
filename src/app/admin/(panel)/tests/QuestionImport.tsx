"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseQuestionText, readQuestionFile, type ParsedQuestions } from "@/lib/test-import";
import { importQuestions, type ImportResult } from "./actions";

const sample = `1. 2 + 2 nechaga teng?
A) 3
*B) 4
C) 5
D) 22
Izoh: 2 ga 2 ni qo‘shsak, 4 bo‘ladi.

2. O‘zbekiston poytaxti qaysi shahar?
A) Samarqand
B) Toshkent
C) Buxoro
D) Xiva
Javob: B`;

const letters = "ABCDEF";

/** Paste questions (Word layout) or pick an Excel file → preview → save. */
export default function QuestionImport({ testId, existing }: { testId: number; existing: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedQuestions | null>(null);
  const [replace, setReplace] = useState(false);
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [saving, startSaving] = useTransition();

  const preview = tab === "text" ? (text.trim() ? parseQuestionText(text) : null) : parsed;

  function save() {
    const form = new FormData();
    if (tab === "file" && file) form.set("file", file);
    else form.set("text", text);
    if (replace) form.set("replace", "on");
    if (topic.trim()) form.set("topic", topic.trim());
    startSaving(async () => {
      const r = await importQuestions(testId, form);
      setResult(r);
      if (r.added != null) {
        setText("");
        setFile(null);
        setParsed(null);
        router.refresh();
      }
    });
  }

  const tabClass = (on: boolean) => `rounded-lg px-4 py-2 text-sm font-semibold ${on ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`;
  const ok = preview && !preview.errors.length && preview.questions.length > 0;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">Savollarni ko‘plab yuklash</h2>
      <p className="mt-1 text-sm text-slate-600">
        Word’dagi testni nusxalab qo‘ying yoki Excel fayl tanlang. To‘g‘ri javob: variant oldida <b>*</b>, variantlardan keyin{" "}
        <b>Javob: B</b> yoki oxirida <b>Javoblar: 1-B, 2-A, …</b>. Saqlashdan oldin natija ko‘rsatiladi; xato bo‘lsa hech narsa saqlanmaydi.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTab("text")} className={tabClass(tab === "text")}>
          Matndan
        </button>
        <button type="button" onClick={() => setTab("file")} className={tabClass(tab === "file")}>
          Excel fayldan
        </button>
        <a href="/admin/export/test-template" download className="ml-auto text-sm font-semibold text-blue-700 hover:underline">
          ⬇ Excel namuna
        </a>
      </div>

      {tab === "text" ? (
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          rows={12}
          placeholder={sample}
          className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      ) : (
        <div className="mt-3 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
          <label className={`inline-block cursor-pointer rounded-lg px-5 py-2.5 font-semibold text-white ${saving ? "bg-slate-400" : "bg-blue-700 hover:bg-blue-800"}`}>
            {file ? "Boshqa fayl tanlash" : "Excel faylni tanlash"}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={saving}
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setFile(f);
                setResult(null);
                setParsed(await readQuestionFile(f));
              }}
            />
          </label>
          <p className="mt-2 text-sm text-slate-500">{file ? file.name : "Ustunlar: Savol, A, B, C, D, Javob, Izoh. Faqat .xlsx."}</p>
        </div>
      )}

      {preview && (
        <div className="mt-4 space-y-3">
          {preview.errors.length > 0 && (
            <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Tuzating va qayta tekshiring:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {preview.errors.slice(0, 30).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              {preview.errors.length > 30 && <p className="mt-1">…yana {preview.errors.length - 30} ta</p>}
            </div>
          )}
          {preview.questions.length > 0 && (
            <details className="rounded-lg border border-slate-200 p-3 text-sm" open={preview.questions.length <= 5}>
              <summary className="cursor-pointer font-semibold text-slate-800">{preview.questions.length} ta savol topildi — ko‘rish</summary>
              <ol className="mt-3 space-y-3">
                {preview.questions.slice(0, 50).map((q, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-3">
                    <p className="whitespace-pre-line font-medium">
                      {i + 1}. {q.question}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {q.options.map((o, k) => (
                        <li key={k} className={k === q.correct ? "font-semibold text-green-700" : "text-slate-600"}>
                          {letters[k]}) {o} {k === q.correct && "✓"}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && <p className="mt-1 text-xs text-slate-500">Izoh: {q.explanation}</p>}
                  </li>
                ))}
              </ol>
              {preview.questions.length > 50 && <p className="mt-2 text-slate-500">…va yana {preview.questions.length - 50} ta</p>}
            </details>
          )}
        </div>
      )}

      {result && (
        <div role="status" className={`mt-4 rounded-lg p-4 text-sm ${result.added != null ? "bg-green-50 text-green-900" : "bg-red-50 text-red-800"}`}>
          {result.added != null ? (
            <b>
              Saqlandi: {result.added} ta savol qo‘shildi{result.removed ? `, ${result.removed} ta eski savol o‘chirildi` : ""}.
            </b>
          ) : (
            <>
              {result.error && <b>{result.error}</b>}
              {result.errors && (
                <ul className="list-disc pl-5">
                  {result.errors.slice(0, 30).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <label className="mt-4 block max-w-md text-sm font-medium text-slate-700">
        Mavzu (ixtiyoriy — o‘zida «Mavzu:» yozilmagan savollarga)
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={80}
          placeholder="Masalan: Kasrlar"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={!ok || saving}
          className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400"
        >
          {saving ? "Saqlanmoqda…" : ok ? `${preview.questions.length} ta savolni saqlash` : "Saqlash"}
        </button>
        {existing > 0 && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="size-4" />
            Eski {existing} ta savolni o‘chirib, o‘rniga yozish
          </label>
        )}
      </div>
    </section>
  );
}
