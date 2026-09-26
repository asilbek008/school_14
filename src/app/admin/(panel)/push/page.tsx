import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import TestPush from "./TestPush";
import { setupPush } from "./actions";

export const metadata: Metadata = { title: "Bildirishnomalar" };

const daysAgo = (days: number) => Date.now() - days * 86_400_000;

const langs = { uz: "O‘zbekcha", ru: "Ruscha", en: "Inglizcha" } as const;

/** Web push: how many browsers are subscribed and which news went out. */
export default async function PushPage() {
  const { supabase } = await requireAdmin();
  const [{ data: key }, { data: subs }, { data: sent }] = await Promise.all([
    supabase.rpc("push_public_key"),
    supabase.from("push_subscriptions").select("lang, created_at").order("created_at", { ascending: false }).limit(5000),
    supabase
      .from("news")
      .select("id, title_uz, pushed_at, published_at")
      .gt("pushed_at", new Date(daysAgo(30)).toISOString())
      .order("pushed_at", { ascending: false })
      .limit(10),
  ]);
  const rows = subs ?? [];
  const week = rows.filter((s) => Date.parse(s.created_at) > daysAgo(7)).length;
  const tile = "rounded-xl bg-white p-4 shadow-sm";

  return (
    <>
      <AdminHeader title="Bildirishnomalar" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={tile}>
          <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
          <p className="text-sm text-slate-500">obunachi (brauzer)</p>
        </div>
        <div className={tile}>
          <p className="text-2xl font-bold text-slate-900">{week}</p>
          <p className="text-sm text-slate-500">shu hafta qo‘shilgan</p>
        </div>
        {(Object.keys(langs) as (keyof typeof langs)[]).slice(0, 2).map((l) => (
          <div key={l} className={tile}>
            <p className="text-2xl font-bold text-slate-900">{rows.filter((s) => s.lang === l).length}</p>
            <p className="text-sm text-slate-500">{langs[l]}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
        <p>
          Ota-onalar va o‘quvchilar saytdagi <b>«Yangiliklar»</b> sahifasida yoki pastki qismda <b>«Bildirishnomani yoqish»</b> tugmasini
          bosadi. Yangi yangilik e’lon qilinganda (Telegram’dan kelganlari ham) 5 daqiqa ichida ularning telefoni yoki kompyuteriga
          bildirishnoma boradi — o‘zi tanlagan tilda. Hech kimning ismi yoki raqami saqlanmaydi.
        </p>
        <p className="mt-2">iPhone’da bildirishnoma faqat sayt «Bosh ekranga qo‘shish» orqali o‘rnatilganda ishlaydi (iOS 16.4+).</p>
        <div className="mt-4">
          {key ? (
            <TestPush />
          ) : (
            <form action={setupPush}>
              <p className="mb-2 font-semibold text-amber-800">Bildirishnomalar hali ishga tushirilmagan — saytda tugma ko‘rinmaydi.</p>
              <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Ishga tushirish</button>
            </form>
          )}
        </div>
      </div>

      <h2 className="mb-3 font-bold text-slate-900">Yuborilgan yangiliklar (30 kun)</h2>
      {sent?.length ? (
        <ul className="space-y-2">
          {sent.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
              <Link href={`/admin/news/${n.id}`} className="font-medium text-slate-900 hover:underline">
                {n.title_uz}
              </Link>
              <span className="text-sm text-slate-500">{formatDateTime(n.pushed_at!, "uz")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm">Hali yuborilgan yangilik yo‘q.</p>
      )}
    </>
  );
}
