"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { apply, cabinetKey, collect, merge, setCabinetKey, summary, syncCabinet, type CabinetData } from "@/lib/cabinet";

type Props = { t: Dictionary["cabinet"]; lang: Locale; bot: string | null };

const tiles = ["tests", "answered", "correct", "mastered", "best"] as const;
const tint = ["bg-brand-soft text-brand-deep", "bg-teal-soft text-teal", "bg-gold-soft text-gold-deep", "bg-brand-soft text-brand-deep", "bg-teal-soft text-teal"];

/** Linking the cabinet to the bot, and the progress it holds. */
export default function CabinetPanel({ t, lang, bot }: Props) {
  const [key, setKey] = useState<string | null>(null);
  const [data, setData] = useState<CabinetData>({});
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read this browser's own data first, then the cabinet if there is one.
  useEffect(() => {
    const id = setTimeout(async () => {
      setData(collect());
      if (!cabinetKey()) return;
      setKey(cabinetKey());
      const result = await syncCabinet();
      if (result.ok) setData(result.data);
      else if (result.error === "gone") setKey(null);
    }, 0);
    return () => {
      clearTimeout(id);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  /** After the deep link opens, wait for the bot to answer. */
  function poll(token: string, tries = 40) {
    timer.current = setTimeout(async () => {
      const { data: checked } = await createClient().rpc("cabinet_check", { p_token: token });
      const answer = checked as { key?: string; data?: CabinetData; waiting?: boolean } | null;
      if (answer?.key) {
        setCabinetKey(answer.key);
        setKey(answer.key);
        setWaiting(false);
        const merged = merge(collect(), answer.data ?? {});
        apply(merged);
        setData(merged);
        await createClient().rpc("cabinet_save", { p_key: answer.key, p_data: merged });
        return setNote({ ok: true, text: t.connected });
      }
      if (tries > 1) return poll(token, tries - 1);
      setWaiting(false);
      setNote({ ok: false, text: t.failed });
    }, 3000);
  }

  async function connect() {
    if (!bot) return setNote({ ok: false, text: t.noBot });
    setBusy(true);
    setNote(null);
    const { data: token, error } = await createClient().rpc("cabinet_link");
    setBusy(false);
    if (error || !token) return setNote({ ok: false, text: t.failed });
    window.open(`https://t.me/${bot}?start=cab_${token as string}`, "_blank", "noopener");
    setWaiting(true);
    poll(token as string);
  }

  async function refresh() {
    setBusy(true);
    setNote(null);
    const result = await syncCabinet();
    setBusy(false);
    if (result.ok) {
      setData(result.data);
      return setNote({ ok: true, text: t.synced });
    }
    if (result.error === "gone") setKey(null);
    setNote({ ok: false, text: result.error === "gone" ? t.gone : t.failed });
  }

  async function forget() {
    if (!key || !window.confirm(t.forgetAsk)) return;
    setBusy(true);
    await createClient().rpc("cabinet_forget", { p_key: key });
    setCabinetKey(null);
    setKey(null);
    setBusy(false);
    setNote({ ok: true, text: t.forgotten });
  }

  const s = summary(data);
  const values: Record<(typeof tiles)[number], string> = {
    tests: String(s.tests),
    answered: String(s.answered),
    correct: String(s.correct),
    mastered: String(s.mastered),
    best: s.tests ? `${s.best}%` : "—",
  };

  return (
    <div className="space-y-6">
      <section className="reveal rounded-[14px] border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[15.5px] font-bold text-slate-900">
              {key ? `✓ ${t.connected}` : waiting ? t.waiting : t.title}
            </p>
            <p className="mt-1 text-[13.5px] text-slate-500">{t.privacy}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {key ? (
              <>
                <button type="button" onClick={refresh} disabled={busy} className="press rounded-full bg-brand px-5 py-2.5 text-[14px] font-bold text-white hover:bg-brand-deep disabled:opacity-60">
                  {busy ? t.syncing : t.sync}
                </button>
                <button type="button" onClick={forget} disabled={busy} className="press rounded-full border border-slate-300 px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50">
                  {t.forget}
                </button>
              </>
            ) : (
              <button type="button" onClick={connect} disabled={busy || waiting} className="press rounded-full bg-brand px-5 py-2.5 text-[14px] font-bold text-white hover:bg-brand-deep disabled:opacity-60">
                ✈️ {t.connect}
              </button>
            )}
          </div>
        </div>
        {note && <p className={`mt-3 rounded-xl px-4 py-2.5 text-[14px] font-semibold ${note.ok ? "bg-teal-soft text-teal" : "bg-[#fae7e2] text-[#c9553f]"}`}>{note.text}</p>}
      </section>

      <section className="reveal">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((name, i) => (
            <li key={name} className={`rounded-[14px] px-4 py-5 text-center ${tint[i]}`}>
              <p className="font-display text-[28px] font-extrabold leading-none">{values[name]}</p>
              <p className="mt-1.5 text-[12.5px] font-semibold opacity-80">{t.stats[name]}</p>
            </li>
          ))}
        </ul>
        {!s.tests && !s.answered && (
          <p className="mt-4 rounded-[14px] border border-slate-200 bg-white p-6 text-center text-[14.5px] text-slate-500">
            {t.empty}{" "}
            <Link href={`/${lang}/tests`} className="font-bold text-brand-deep link-grow">
              {t.toTests} →
            </Link>
          </p>
        )}
      </section>

      <section className="reveal rounded-[14px] bg-navy px-5 py-6 text-white sm:px-7">
        <h2 className="font-display text-lg font-extrabold">{t.how}</h2>
        <ol className="mt-3 space-y-2 text-[14.5px] text-[#c7d0ea]">
          {t.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-[12.5px] font-bold text-white">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
