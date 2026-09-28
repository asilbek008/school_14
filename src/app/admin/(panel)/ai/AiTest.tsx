"use client";

import { useState, useTransition } from "react";
import { testAi, type TestState } from "./actions";

/** One real question through the assistant, so a key can be checked without leaving the panel. */
export default function AiTest() {
  const [result, setResult] = useState<TestState | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Ulanishni tekshirish</p>
          <p className="text-sm text-slate-600">Yordamchiga bitta savol yuboriladi: «Maktabning telefon raqami va ish vaqti qanday?»</p>
        </div>
        <button
          type="button"
          onClick={() => start(async () => setResult(await testAi()))}
          disabled={pending}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {pending ? "Tekshirilmoqda…" : "Sinov savoli"}
        </button>
      </div>
      {result && (
        <p className={`mt-3 rounded-lg p-3 text-sm ${result.ok ? "bg-green-50 text-green-900" : "bg-red-50 text-red-800"}`}>
          {result.ok ? `✓ Ishlayapti. Javob: ${result.answer}` : result.error}
        </p>
      )}
    </div>
  );
}
