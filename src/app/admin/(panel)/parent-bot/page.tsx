import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { parentBotStatus } from "@/lib/parent-bot";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  BotPreview,
  BotStatusCard,
} from "@/components/admin/dashboard/BotCards";
import ParentBotForm from "./ParentBotForm";
import { reconnectParentBot, removeParentBot } from "./actions";

export const metadata: Metadata = { title: "Ota-onalar boti" };

/** The parents' Telegram bot: connect it, see whether Telegram reaches it and how many chats use it. */
export default async function ParentBotPage({
  searchParams,
}: PageProps<"/admin/parent-bot">) {
  const { supabase } = await requireAdmin();
  const { saved } = await searchParams;
  const bot = await parentBotStatus(supabase);
  const tile = "rounded-2xl bg-white p-4";

  return (
    <>
      <AdminHeader title="Ota-onalar boti" />
      {saved && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          Saqlandi.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={tile}>
          <p className="text-2xl font-bold text-slate-900">{bot.chats}</p>
          <p className="text-sm text-slate-500">foydalanuvchi (chat)</p>
        </div>
        <div className={tile}>
          <p className="text-2xl font-bold text-slate-900">{bot.subscribed}</p>
          <p className="text-sm text-slate-500">yangiliklarga obuna</p>
        </div>
        <div className={tile}>
          <p className="text-2xl font-bold text-slate-900">{bot.withClass}</p>
          <p className="text-sm text-slate-500">sinfini tanlagan</p>
        </div>
        <div className={tile}>
          <p
            className={`text-lg font-bold ${!bot.connected ? "text-slate-400" : bot.healthy ? "text-green-700" : "text-red-700"}`}
          >
            {!bot.connected ? "Ulanmagan" : bot.healthy ? "Ishlayapti" : "Xato"}
          </p>
          <p className="text-sm text-slate-500">holat</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl bg-white p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Ota-onalar botga farzandining sinfini yozadi (masalan <b>8-A</b>) va
            bugungi yoki ertangi darslarni, maktab yangiliklari va tadbirlarni
            oladi. Saytda yangi yangilik e’lon qilinganda (Telegram kanaldan
            kelganlari ham) 5 daqiqa ichida obuna bo‘lganlarga botdan
            yuboriladi. Bot hech kimning ismi yoki raqamini saqlamaydi — faqat
            chat raqami, tanlangan sinf va obuna.
          </p>

          {bot.connected ? (
            <div className="mt-4 space-y-3 text-sm">
              <p>
                Bot:{" "}
                <a
                  href={`https://t.me/${bot.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  @{bot.username}
                </a>{" "}
                — bu havolani ota-onalar guruhlariga yuboring. Saytning pastki
                qismida va «Aloqa» sahifasida ham chiqadi.
              </p>
              {!bot.healthy && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-red-800">
                  Telegram botga yetib bora olmayapti
                  {bot.error ? `: ${bot.error}` : ""}. «Qayta ulash»ni bosing.
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                <form action={reconnectParentBot}>
                  <button className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900">
                    Qayta ulash
                  </button>
                </form>
                <form action={removeParentBot}>
                  <button className="rounded-lg px-4 py-2 font-semibold text-red-700 hover:bg-red-50">
                    Botni uzish
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
              <li>
                Telegram&apos;da{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  @BotFather
                </a>{" "}
                ni oching va <b>/newbot</b> yozing.
              </li>
              <li>
                Bot nomini kiriting (masalan <i>14-maktab ota-onalar</i>), keyin
                username (masalan <i>qiziriq14maktab_bot</i>).
              </li>
              <li>
                BotFather bergan tokenni pastdagi maydonga qo‘ying va «Botni
                ulash»ni bosing.
              </li>
              <li>
                Kanal uchun ulangan sayt botidan foydalanmang — bu alohida bot
                bo‘lishi kerak.
              </li>
            </ol>
          )}
          <div className="mt-5 max-w-xl">
            <ParentBotForm connected={bot.connected} />
          </div>
        </section>
        <div className="space-y-5">
          <BotStatusCard bot={bot} />
          <BotPreview username={bot.username} />
        </div>
      </div>
    </>
  );
}
