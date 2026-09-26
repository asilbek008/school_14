import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { telegram } from "@/lib/telegram-bot";
import AdminHeader from "@/components/admin/AdminHeader";
import ParentBotForm from "./ParentBotForm";
import { reconnectParentBot, removeParentBot } from "./actions";

export const metadata: Metadata = { title: "Ota-onalar boti" };

const withinHour = (unixSeconds?: number) => !!unixSeconds && unixSeconds * 1000 > Date.now() - 3_600_000;

type Hook = { url: string; pending_update_count: number; last_error_date?: number; last_error_message?: string };

/** The parents' Telegram bot: connect it, see whether Telegram reaches it and how many chats use it. */
export default async function ParentBotPage({ searchParams }: PageProps<"/admin/parent-bot">) {
  const { supabase } = await requireAdmin();
  const { saved } = await searchParams;
  const [{ data: s }, { data: chats }] = await Promise.all([
    supabase.from("telegram_settings").select("parent_bot_token, parent_bot_username").eq("id", 1).single(),
    supabase.from("parent_bot_chats").select("subscribed, class_id").limit(10000),
  ]);
  const connected = !!s?.parent_bot_token;
  const hook = connected ? await telegram<Hook>(s!.parent_bot_token!, "getWebhookInfo") : null;
  const hookOk = !!hook?.result?.url.endsWith("/functions/v1/parent-bot");
  // An error in the last hour counts; an old one is history.
  const recentError = withinHour(hook?.result?.last_error_date) ? hook?.result?.last_error_message : null;
  const rows = chats ?? [];
  const tile = "rounded-xl bg-white p-4 shadow-sm";

  return (
    <>
      <AdminHeader title="Ota-onalar boti" />
      {saved && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">Saqlandi.</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={tile}>
          <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
          <p className="text-sm text-slate-500">foydalanuvchi (chat)</p>
        </div>
        <div className={tile}>
          <p className="text-2xl font-bold text-slate-900">{rows.filter((r) => r.subscribed).length}</p>
          <p className="text-sm text-slate-500">yangiliklarga obuna</p>
        </div>
        <div className={tile}>
          <p className="text-2xl font-bold text-slate-900">{rows.filter((r) => r.class_id).length}</p>
          <p className="text-sm text-slate-500">sinfini tanlagan</p>
        </div>
        <div className={tile}>
          <p className={`text-lg font-bold ${!connected ? "text-slate-400" : hookOk && !recentError ? "text-green-700" : "text-red-700"}`}>
            {!connected ? "Ulanmagan" : hookOk && !recentError ? "Ishlayapti" : "Xato"}
          </p>
          <p className="text-sm text-slate-500">holat</p>
        </div>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-600">
          Ota-onalar botga farzandining sinfini yozadi (masalan <b>8-A</b>) va bugungi yoki ertangi darslarni, maktab yangiliklari va
          tadbirlarni oladi. Saytda yangi yangilik e’lon qilinganda (Telegram kanaldan kelganlari ham) 5 daqiqa ichida obuna bo‘lganlarga
          botdan yuboriladi. Bot hech kimning ismi yoki raqamini saqlamaydi — faqat chat raqami, tanlangan sinf va obuna.
        </p>

        {connected ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>
              Bot:{" "}
              <a href={`https://t.me/${s!.parent_bot_username}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                @{s!.parent_bot_username}
              </a>{" "}
              — bu havolani ota-onalar guruhlariga yuboring. Saytning pastki qismida va «Aloqa» sahifasida ham chiqadi.
            </p>
            {(!hookOk || recentError) && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-red-800">
                Telegram botga yetib bora olmayapti{recentError ? `: ${recentError}` : ""}. «Qayta ulash»ni bosing.
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <form action={reconnectParentBot}>
                <button className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900">Qayta ulash</button>
              </form>
              <form action={removeParentBot}>
                <button className="rounded-lg px-4 py-2 font-semibold text-red-700 hover:bg-red-50">Botni uzish</button>
              </form>
            </div>
          </div>
        ) : (
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            <li>
              Telegram&apos;da{" "}
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                @BotFather
              </a>{" "}
              ni oching va <b>/newbot</b> yozing.
            </li>
            <li>
              Bot nomini kiriting (masalan <i>14-maktab ota-onalar</i>), keyin username (masalan <i>qiziriq14maktab_bot</i>).
            </li>
            <li>BotFather bergan tokenni pastdagi maydonga qo‘ying va «Botni ulash»ni bosing.</li>
            <li>Kanal uchun ulangan sayt botidan foydalanmang — bu alohida bot bo‘lishi kerak.</li>
          </ol>
        )}
        <div className="mt-5 max-w-xl">
          <ParentBotForm connected={connected} />
        </div>
      </section>
    </>
  );
}
