import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import TelegramForm from "./TelegramForm";
import BotForm from "./BotForm";
import { recheckBot, removeBot, syncTelegramNow } from "./actions";

export const metadata: Metadata = { title: "Telegram" };

type ImportedRow = {
  post_id: number;
  channel: string;
  skipped: string | null;
  imported_at: string;
  news: { id: number; title_uz: string } | null;
  events: { id: number; title_uz: string } | null;
};

export default async function TelegramPage({ searchParams }: PageProps<"/admin/telegram">) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const [{ data: settings }, { data: imported }, { count: newsTotal }, { count: newsHd }] = await Promise.all([
    supabase
      .from("telegram_settings")
      .select("channel, enabled, auto_publish, import_since, last_synced_at, last_status, bot_username, bot_status, bot_chat_id")
      .eq("id", 1)
      .single(),
    supabase
      .from("telegram_posts")
      .select("post_id, channel, skipped, imported_at, news(id, title_uz), events(id, title_uz)")
      .order("imported_at", { ascending: false })
      .order("post_id", { ascending: false })
      .limit(15),
    supabase.from("telegram_posts").select("post_id", { count: "exact", head: true }).not("news_id", "is", null),
    supabase.from("telegram_posts").select("post_id", { count: "exact", head: true }).not("news_id", "is", null).eq("hd", true),
  ]);
  if (!settings) return <p>Sozlamalarni o‘qib bo‘lmadi.</p>;
  // Without generated DB types supabase-js types to-one embeds as arrays.
  const rows = (imported ?? []) as unknown as ImportedRow[];

  return (
    <>
      <AdminHeader title="Telegram kanal" />
      <p className="-mt-3 mb-6 max-w-3xl text-slate-600">
        Maktabning ochiq Telegram kanalidagi yangi postlar har 15 daqiqada saytga avtomatik qo‘shiladi: oddiy postlar —
        «Yangiliklar»ga, tadbir postlari — «Tadbirlar»ga. Qo‘shilganini keyin odatdagidek tahrirlash yoki o‘chirish mumkin.
      </p>

      {params.saved && <Notice>Saqlandi.</Notice>}
      {params.synced === "done" && <Notice>Tekshirildi — natija quyida.</Notice>}
      {params.synced === "error" && <Notice error>Telegram bilan bog‘lanib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.</Notice>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <TelegramForm settings={settings} />

        <aside className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">Holat</h2>
            <p className="mt-2 text-sm text-slate-600">
              {settings.enabled && settings.channel ? (
                <>
                  <span className="font-semibold text-green-700">Yoqilgan</span> ·{" "}
                  <a href={`https://t.me/${settings.channel}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                    @{settings.channel}
                  </a>
                </>
              ) : (
                <span className="font-semibold text-slate-500">O‘chirilgan</span>
              )}
            </p>
            {settings.last_synced_at && (
              <p className="mt-2 text-sm text-slate-600">
                Oxirgi tekshiruv: {formatDateTime(settings.last_synced_at, "uz")}
                <br />
                <span className={settings.last_status?.startsWith("Xato") ? "text-red-700" : "text-slate-800"}>
                  {settings.last_status}
                </span>
              </p>
            )}
            {settings.enabled && settings.channel && (
              <form action={syncTelegramNow} className="mt-4">
                <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
                  Hozir tekshirish
                </button>
              </form>
            )}
          </div>

          <div className="rounded-xl bg-white p-5 text-sm text-slate-700 shadow-sm">
            <h2 className="font-bold text-slate-900">Postni qanday yozish kerak</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Birinchi qator — sarlavha, qolgani — matn. Birinchi rasm muqova bo‘ladi.</li>
              <li>
                <b>Tadbir</b> uchun <code>#tadbir</code> (yoki <code>#bayram</code>, <code>#sport</code>,{" "}
                <code>#olimpiada</code>) va sanani yozing: «15-oktabr soat 10:00». Joy: «📍 Faollar zali».
              </li>
              <li>Sana topilmasa, post yangilik bo‘lib qo‘shiladi.</li>
              <li>
                <code>#elon</code> — e’lon, <code>#yutuq</code> — yutuq turkumi.
              </li>
              <li>
                Saytga chiqmasin desangiz — <code>#saytga_emas</code>.
              </li>
              <li>Faqat rasmdan iborat (matnsiz) postlar olinmaydi.</li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="mt-10 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Asl sifatli rasmlar (Telegram bot)</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Telegram&apos;ning ochiq sahifasi rasmlarni faqat kichik (taxminan 800 piksel) nusxada beradi. Bot esa asl
          rasmlarni oladi — saytda ular ancha tiniq ko‘rinadi. Bot kanalda admin bo‘lsa, hammasi avtomatik; admin qilib
          bo‘lmasa, postlarni botga forward qilib yuborasiz.
        </p>
        {settings.bot_username ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>
              Bot:{" "}
              <a href={`https://t.me/${settings.bot_username}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                @{settings.bot_username}
              </a>
            </p>
            <Step done={!!settings.bot_chat_id}>
              {settings.bot_chat_id ? (
                "Bot bilan chat ulangan."
              ) : (
                <>
                  <a href={`https://t.me/${settings.bot_username}?start=sayt`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                    Botni oching
                  </a>{" "}
                  va <b>Start</b> tugmasini bosing (keyingi tekshiruvda ulanadi).
                </>
              )}
            </Step>
            {settings.bot_status === "ok" ? (
              <Step done>Bot kanalda admin — yangi va eski postlarning rasmlari avtomatik asl sifatda olinadi.</Step>
            ) : (
              <div className="rounded-lg bg-amber-50 p-4 text-slate-700">
                <p className="font-semibold text-slate-900">
                  {settings.bot_status === "no_channel"
                    ? "Avval yuqorida kanalni saqlang."
                    : `Bot @${settings.channel} kanalida admin emas — rasmlarni botga forward qilib yuboring:`}
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Kanalda rasmli postni bosib turing (bir nechtasini birdaniga tanlash ham mumkin) → <b>Forward</b> (Uzatish).</li>
                  <li>
                    <b>@{settings.bot_username}</b> ni tanlang va yuboring. «Muallifsiz yuborish»ni yoqmang.
                  </li>
                  <li>Bot «✅ … ta rasm olindi» deb javob beradi; saytdagi yangilik 15 daqiqa ichida yangilanadi.</li>
                </ol>
                <p className="mt-2 text-slate-600">
                  Kelajakda kanal egasi botni admin qilsa, «Qayta tekshirish»ni bosing — shundan keyin forward shart emas.
                </p>
              </div>
            )}
            <p className="text-slate-600">
              Asl sifatga o‘tgan yangiliklar: <b>{newsHd ?? 0}</b> / {newsTotal ?? 0} (har tekshiruvda bir nechtadan almashtiriladi).
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {settings.bot_status !== "ok" && (
                <form action={recheckBot}>
                  <button className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900">Qayta tekshirish</button>
                </form>
              )}
              <form action={removeBot}>
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
              ni oching, <code>/newbot</code> yozing, botga nom bering — u sizga <b>token</b> beradi.
            </li>
            <li>
              Imkoni bo‘lsa, kanal sozlamalari → Adminlar → Admin qo‘shish → botni tanlang (qo‘shimcha huquq shart emas).
              Imkoni bo‘lmasa ham bo‘ladi — rasmli postlarni botga forward qilasiz.
            </li>
            <li>Tokenni pastga qo‘yib, «Botni ulash»ni bosing.</li>
          </ol>
        )}
        <div className="mt-5 max-w-xl">
          <BotForm connected={!!settings.bot_username} />
        </div>
      </section>

      <h2 className="mb-3 mt-10 text-lg font-bold">Oxirgi olingan postlar</h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {rows.length ? (
          <ul className="divide-y divide-slate-100 text-sm">
            {rows.map((row) => (
              <li key={`${row.channel}-${row.post_id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <span className="min-w-0">
                  {row.news ? (
                    <Link href={`/admin/news/${row.news.id}`} className="font-medium text-blue-700 hover:underline">
                      Yangilik: {row.news.title_uz}
                    </Link>
                  ) : row.events ? (
                    <Link href={`/admin/events/${row.events.id}`} className="font-medium text-blue-700 hover:underline">
                      Tadbir: {row.events.title_uz}
                    </Link>
                  ) : (
                    <span className="text-slate-500">{row.skipped ? `O‘tkazib yuborildi (${row.skipped})` : "Saytdan o‘chirilgan"}</span>
                  )}
                </span>
                <a href={`https://t.me/${row.channel}/${row.post_id}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:underline">
                  Telegram&apos;da ↗
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-slate-500">Hali hech narsa olinmagan.</p>
        )}
      </div>
    </>
  );
}

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${done ? "bg-green-600" : "bg-amber-500"}`}>
        {done ? "✓" : "!"}
      </span>
      <span>{children}</span>
    </p>
  );
}

function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <p role="status" className={`mb-6 rounded-lg p-3 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-900"}`}>
      {children}
    </p>
  );
}
