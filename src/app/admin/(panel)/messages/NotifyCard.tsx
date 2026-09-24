import Link from "next/link";
import { checkNotifyChat, sendTestNotify, setMessageNotify } from "./notify-actions";

export type NotifySettings = { botUsername: string | null; chatReady: boolean; on: boolean };

/** Telegram notice for new messages: needs the site's bot and a chat with it (someone pressed Start). */
export default function NotifyCard({ s, flash }: { s: NotifySettings; flash: string | null }) {
  const button = "rounded-lg px-4 py-2 text-sm font-semibold";
  return (
    <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-2 font-bold">
            Telegram bildirishnoma
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.on && s.chatReady ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
              {s.on && s.chatReady ? "Yoqilgan" : "O‘chiq"}
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Saytdagi aloqa formasidan murojaat kelishi bilan sayt boti uni Telegram&apos;ga yuboradi: ism, telefon, mavzu va matn.
          </p>
        </div>
        {s.botUsername && s.chatReady && (
          <div className="flex flex-wrap gap-2">
            <form action={setMessageNotify}>
              <input type="hidden" name="on" value={s.on ? "0" : "1"} />
              <button className={`${button} ${s.on ? "bg-slate-100 text-slate-800 hover:bg-slate-200" : "bg-blue-700 text-white hover:bg-blue-800"}`}>
                {s.on ? "O‘chirish" : "Yoqish"}
              </button>
            </form>
            <form action={sendTestNotify}>
              <button className={`${button} border border-slate-200 text-slate-800 hover:bg-slate-50`}>Sinov xabari</button>
            </form>
          </div>
        )}
      </div>

      {!s.botUsername ? (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-slate-700">
          Avval{" "}
          <Link href="/admin/telegram" className="font-semibold text-blue-700 hover:underline">
            Telegram bo‘limida
          </Link>{" "}
          botni ulang (@BotFather tokeni). Shu bot xabarlarni yuboradi.
        </p>
      ) : !s.chatReady ? (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-slate-700">
          <p>
            Bildirishnomalar keladigan Telegram hisobidan{" "}
            <a href={`https://t.me/${s.botUsername}?start=xabarlar`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
              @{s.botUsername}
            </a>{" "}
            botini oching va <b>Start</b> ni bosing, keyin «Tekshirish»ni bosing.
          </p>
          <form action={checkNotifyChat} className="mt-2">
            <button className={`${button} bg-slate-800 text-white hover:bg-slate-900`}>Tekshirish</button>
          </form>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Xabarlar @{s.botUsername} botida <b>Start</b> ni oxirgi bosgan hisobga keladi. Boshqa hisobga o‘tkazish uchun o‘sha hisobdan
          botga Start yuboring.
        </p>
      )}

      {flash && (
        <p role="status" className={`mt-3 rounded-lg p-3 text-sm ${flash.startsWith("✗") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {flash}
        </p>
      )}
    </section>
  );
}
