"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Turn = { question: string; answer: string | null; error?: string };

/**
 * The question box. The answer comes from the school's Edge Function, which holds the key; the browser only
 * sends the question, the language and the same anonymous id the visit counter uses.
 */
export default function AssistantChat({ t, lang }: { t: Dictionary["assistant"]; lang: Locale }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turns.length) end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns]);

  async function ask(text: string) {
    const asked = text.trim();
    if (asked.length < 3 || pending) return;
    setQuestion("");
    setPending(true);
    setTurns((list) => [...list, { question: asked, answer: null }]);
    let visitor: string | null = null;
    try {
      visitor = localStorage.getItem("vid");
    } catch {
      visitor = null;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
        body: JSON.stringify({ question: asked, lang, visitor }),
      });
      const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
      setTurns((list) =>
        list.map((turn, i) => (i === list.length - 1 ? { ...turn, answer: data.answer ?? null, error: data.answer ? undefined : (data.error ?? "model") } : turn)),
      );
    } catch {
      setTurns((list) => list.map((turn, i) => (i === list.length - 1 ? { ...turn, error: "model" } : turn)));
    }
    setPending(false);
  }

  const errorText = (key: string) => t.errors[key as keyof typeof t.errors] ?? t.errors.model;

  return (
    <div className="space-y-5">
      {turns.length > 0 && (
        <ul className="space-y-4">
          {turns.map((turn, i) => (
            <li key={i} className="space-y-2">
              <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-[15px] text-white">{turn.question}</p>
              {turn.answer ? (
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line text-slate-800">
                  {turn.answer}
                </div>
              ) : turn.error ? (
                <p className="max-w-[92%] rounded-2xl rounded-bl-sm bg-[#fae7e2] px-4 py-3 text-[14.5px] font-semibold text-[#c9553f]">{errorText(turn.error)}</p>
              ) : (
                <p className="max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-[14.5px] text-slate-500">{t.asking}</p>
              )}
            </li>
          ))}
          <div ref={end} />
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="flex flex-wrap gap-2 sm:flex-nowrap"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
          placeholder={t.placeholder}
          className="min-w-0 flex-1 rounded-full border border-slate-300 px-5 py-3 text-[15px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
        />
        <button type="submit" disabled={pending || question.trim().length < 3} className="press rounded-full bg-brand px-6 py-3 text-[15px] font-bold text-white hover:bg-brand-deep disabled:opacity-60">
          {pending ? t.asking : t.ask}
        </button>
      </form>

      {turns.length === 0 && (
        <ul className="flex flex-wrap gap-2">
          {t.samples.map((sample) => (
            <li key={sample}>
              <button type="button" onClick={() => void ask(sample)} className="press rounded-full bg-brand-soft px-4 py-2 text-[13.5px] font-semibold text-brand-deep hover:bg-brand hover:text-white">
                {sample}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
