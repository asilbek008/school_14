import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import { takeBackup } from "./actions";

export const metadata: Metadata = { title: "Zaxira nusxalar" };

// Friendly names for the tables in a backup.
const names: Record<string, string> = {
  news: "Yangiliklar",
  events: "Tadbirlar",
  staff: "Xodimlar",
  lessons: "Darslar",
  school_classes: "Sinflar",
  achievements: "Yutuqlar",
  gallery_albums: "Albomlar",
  gallery_photos: "Albom rasmlari",
  tests: "Testlar",
  test_questions: "Test savollari",
  textbooks: "Kitoblar",
  documents: "Hujjatlar",
  contact_messages: "Xabarlar",
  admission_applications: "Qabul arizalari",
};

/** Weekly snapshots of the site's data (Sunday night), the last 8; download one to keep it off-site. */
export default async function BackupsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("backups").select("id, taken_at, taken_by, counts, bytes").order("taken_at", { ascending: false });
  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Zaxira nusxalar" />
      <div className="mb-6 rounded-xl bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
        <p>
          Har yakshanba kechasi (03:07) saytdagi barcha ma’lumotlar — yangiliklar, tadbirlar, xodimlar, dars jadvali, testlar,
          murojaatlar va boshqalar — avtomatik saqlanadi. Oxirgi 8 hafta nusxasi turadi.
        </p>
        <p className="mt-2">
          Oyiga bir marta eng yangisini <b>yuklab olib</b>, fleshka yoki Google Drive’da saqlab qo‘ying — sayt bilan biror narsa bo‘lsa, shu
          fayldan tiklanadi. Rasmlar va PDF fayllar alohida (Supabase Storage’da) saqlanadi, bu faylga kirmaydi.
        </p>
        <form action={takeBackup} className="mt-4">
          <button className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">Hozir zaxira olish</button>
        </form>
      </div>

      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((b, i) => {
            const counts = (b.counts ?? {}) as Record<string, number>;
            const total = Object.values(counts).reduce((a, n) => a + n, 0);
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {formatDateTime(b.taken_at, "uz")}
                    {i === 0 && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">Eng yangisi</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {b.taken_by === "cron" ? "Avtomatik" : b.taken_by} · {Math.max(1, Math.round(b.bytes / 1024))} KB · {total} ta yozuv
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {Object.entries(names)
                      .filter(([t]) => counts[t])
                      .map(([t, label]) => `${label}: ${counts[t]}`)
                      .join(" · ")}
                  </p>
                </div>
                <a href={`/admin/backups/${b.id}`} download className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  ⬇ Yuklab olish
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali zaxira nusxa yo‘q.</p>
      )}
    </>
  );
}
