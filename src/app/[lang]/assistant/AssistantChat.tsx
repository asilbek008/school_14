"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { readEvents } from "@/lib/sse";

type Turn = { question: string; answer: string; done: boolean; error?: string };

/** What goes back with a follow-up, so "va ertaga?" still makes sense. Only finished answers count. */
const history = (turns: Turn[]) => turns.filter((t) => t.done && !t.error && t.answer).map((t) => ({ q: t.question, a: t.answer }));

/**
 * The question box. The answer comes from the school's Edge Function, which holds the key; the browser only
 * sends the question, the language, the conversation so far and the same anonymous id the visit counter uses.
 * The answer arrives as a stream, so it starts appearing while it is still being written.
 */
export default function AssistantChat({ t, lang }: { t: Dictionary["assistant"]; lang: Locale }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (turns.length) end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns]);

  // A half-written answer left behind by a closed tab helps nobody.
  useEffect(() => () => abort.current?.abort(), []);

  /** Updates the answer being written, without touching the turns before it. */
  const last = (change: (turn: Turn) => Turn) => setTurns((list) => list.map((turn, i) => (i === list.length - 1 ? change(turn) : turn)));

  async function ask(text: string) {
    const asked = text.trim();
    if (asked.length < 3 || pending) return;
    const sending = history(turns);
    setQuestion("");
    setPending(true);
    setTurns((list) => [...list, { question: asked, answer: "", done: false }]);

    let visitor: string | null = null;
    try {
      visitor = localStorage.getItem("vid");
    } catch {
      visitor = null;
    }

    const controller = new AbortController();
    abort.current = controller;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
        body: JSON.stringify({ question: asked, lang, visitor, history: sending }),
        signal: controller.signal,
      });

      // Everything that goes wrong before the first word still comes back as plain JSON.
      if (!res.ok || !res.body || !res.headers.get("content-type")?.includes("event-stream")) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        last((turn) => ({ ...turn, done: true, error: data.error ?? "model" }));
        return;
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const { events, rest } = readEvents(buffer + value);
        buffer = rest;
        for (const event of events) {
          if (event.text) last((turn) => ({ ...turn, answer: turn.answer + event.text }));
          else if (event.error) last((turn) => ({ ...turn, done: true, error: event.error }));
          else if (event.done) last((turn) => ({ ...turn, done: true }));
        }
      }
      // The connection ended without a closing event: keep whatever was written.
      last((turn) => (turn.done ? turn : { ...turn, done: true, error: turn.answer ? undefined : "model" }));
    } catch (e) {
      const stopped = e instanceof DOMException && e.name === "AbortError";
      last((turn) => ({ ...turn, done: true, error: stopped && turn.answer ? undefined : stopped ? "stopped" : "model" }));
    } finally {
      abort.current = null;
      setPending(false);
    }
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
                  {!turn.done && <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse bg-brand" aria-hidden />}
                </div>
              ) : turn.error ? (
                <p className="max-w-[92%] rounded-2xl rounded-bl-sm bg-[#fae7e2] px-4 py-3 text-[14.5px] font-semibold text-[#c9553f]">{errorText(turn.error)}</p>
              ) : (
                <p className="max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-[14.5px] text-slate-500">{t.asking}</p>
              )}
              {turn.error && turn.answer && <p className="text-[13.5px] font-semibold text-[#c9553f]">{errorText(turn.error)}</p>}
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
          placeholder={turns.length ? t.followUp : t.placeholder}
          className="min-w-0 flex-1 rounded-full border border-slate-300 px-5 py-3 text-[15px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
        />
        {pending ? (
          <button type="button" onClick={() => abort.current?.abort()} className="press rounded-full border border-slate-300 px-6 py-3 text-[15px] font-bold text-slate-700 hover:bg-slate-50">
            {t.stop}
          </button>
        ) : (
          <button type="submit" disabled={question.trim().length < 3} className="press rounded-full bg-brand px-6 py-3 text-[15px] font-bold text-white hover:bg-brand-deep disabled:opacity-60">
            {t.ask}
          </button>
        )}
      </form>

      {turns.length === 0 ? (
        <ul className="flex flex-wrap gap-2">
          {t.samples.map((sample) => (
            <li key={sample}>
              <button type="button" onClick={() => void ask(sample)} className="press rounded-full bg-brand-soft px-4 py-2 text-[13.5px] font-semibold text-brand-deep hover:bg-brand hover:text-white">
                {sample}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !pending && (
          <p className="text-[13.5px] text-slate-500">
            {t.remembers}{" "}
            <button type="button" onClick={() => setTurns([])} className="font-bold text-brand-deep link-grow">
              {t.reset}
            </button>
          </p>
        )
      )}
    </div>
  );
}
