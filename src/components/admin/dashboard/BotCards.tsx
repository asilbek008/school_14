import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { ParentBotStatus } from "@/lib/parent-bot";
import { Svg, type Icon } from "../AdminNav";
import Crest from "../Crest";

const statusPill = (b: ParentBotStatus) =>
  !b.connected
    ? { text: "Ulanmagan", cls: "bg-slate-200 text-slate-600" }
    : b.healthy
      ? { text: "Online", cls: "bg-[#16a34a] text-white" }
      : { text: "Xato", cls: "bg-[#dc2626] text-white" };

/** "Bot holati": the parents' Telegram bot at a glance. The token itself never leaves the server — only dots. */
export function BotStatusCard({ bot }: { bot: ParentBotStatus }) {
  const pill = statusPill(bot);
  const rows: { icon: Icon; label: string; value: string }[] = [
    { icon: "key", label: "Bot token", value: bot.connected ? "•••••••••••••••" : "kiritilmagan" },
    { icon: "history", label: "So‘nggi faollik", value: bot.lastSeen ? formatDateTime(bot.lastSeen, "uz") : "—" },
    { icon: "people", label: "Foydalanuvchilar", value: bot.chats.toLocaleString("ru-RU") },
    { icon: "bell", label: "Yangiliklarga obuna", value: bot.subscribed.toLocaleString("ru-RU") },
  ];
  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-slate-900">Bot holati</h2>
        <span className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${pill.cls}`}>{pill.text}</span>
      </div>
      <div className="mt-4 flex flex-col items-center text-center">
        <Crest className="size-20" />
        <p className="mt-3 text-[18px] font-bold text-slate-900">14-maktab ota-onalar boti</p>
        <p className="text-[14px] text-slate-500">{bot.username ? `@${bot.username}` : "Telegram bot hali ulanmagan"}</p>
      </div>
      <dl className="mt-5 divide-y divide-slate-200 border-y border-slate-200 text-[14px]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 py-2.5">
            <dt className="flex flex-1 items-center gap-2.5 text-slate-600">
              <Svg name={r.icon} className="size-[18px] text-slate-500" />
              {r.label}
            </dt>
            <dd className="font-semibold tabular-nums text-slate-900">{r.value}</dd>
          </div>
        ))}
      </dl>
      {bot.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800">Telegram botga yetib bora olmayapti: {bot.error}</p>}
      <Link
        href="/admin/parent-bot"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[14px] font-bold text-white shadow-[0_10px_24px_-12px_rgb(44_92_224/0.9)] transition-colors hover:bg-brand-deep"
      >
        {bot.connected ? "⚙ Bot sozlamalari" : "＋ Botni ulash"}
      </Link>
    </section>
  );
}

// The bot's real reply keyboard (supabase/functions/parent-bot/bot.ts).
const keys = ["📅 Bugungi darslar", "📆 Ertangi darslar", "📰 Yangiliklar", "🎉 Tadbirlar", "🏫 Sinfni tanlash", "🔔 Obuna"];

/** "Bot preview (Telegram)": how the bot greets a parent — its real welcome text and buttons. */
export function BotPreview({ username }: { username: string | null }) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-slate-900">Bot ko‘rinishi</h2>
        {username && (
          <a href={`https://t.me/${username}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-blue-700 underline-offset-2 hover:underline">
            Telegram’da ochish
          </a>
        )}
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl bg-[#17212b] text-[#e9eef4] ring-1 ring-black/10">
        <div className="flex items-center gap-3 bg-[#1f2c3a] px-4 py-3">
          <Crest className="size-10" />
          <div className="leading-tight">
            <p className="text-[15px] font-bold">14-maktab ota-onalar boti</p>
            <p className="text-[12.5px] text-[#7f91a4]">bot</p>
          </div>
        </div>
        <div className="space-y-2 bg-[radial-gradient(circle_at_20%_10%,rgb(255_255_255/0.04),transparent_40%)] p-3">
          <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-[#2b5278] px-3.5 py-2.5 text-[13.5px] leading-snug">
            Assalomu alaykum! 👋 Bu — <b>Qiziriq tumani 14-maktabi</b>ning ota-onalar uchun boti.
            <br />
            <br />
            Sinfni yozing (masalan <b>8-A</b>) — bugungi darslar keladi.
            <span className="mt-1 block text-right text-[11px] text-[#9fb6cc]">08:00</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {keys.map((k) => (
              <span key={k} className="rounded-lg bg-[#2a3a4c] px-2 py-2.5 text-center text-[13px] font-medium">
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
