import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import ActivityList, { type ActivityItem } from "./ActivityList";

export const metadata: Metadata = { title: "Faoliyat jurnali" };

// Section name and admin page of each logged table.
const sections: Record<string, { name: string; href: (ref: string) => string }> = {
  news: { name: "Yangilik", href: (r) => `/admin/news/${r}` },
  events: { name: "Tadbir", href: (r) => `/admin/events/${r}` },
  staff: { name: "Xodim", href: (r) => `/admin/staff/${r}` },
  clubs: { name: "To‘garak", href: (r) => `/admin/clubs/${r}` },
  gallery_albums: { name: "Albom", href: (r) => `/admin/gallery/${r}` },
  programs: { name: "Doimiy tadbir", href: (r) => `/admin/programs/${r}` },
  pages: { name: "Sahifa", href: (r) => `/admin/pages/${r}` },
  documents: { name: "Hujjat", href: (r) => `/admin/documents/${r}` },
  calendar_periods: { name: "Taqvim", href: (r) => `/admin/calendar/${r}` },
  achievements: { name: "Yutuq", href: (r) => `/admin/achievements/${r}` },
  tests: { name: "Test", href: (r) => `/admin/tests/${r}` },
  textbooks: { name: "Kitob", href: (r) => `/admin/library/${r}` },
  school_classes: { name: "Sinf", href: (r) => `/admin/classes/${r}` },
  subjects: { name: "Fan", href: (r) => `/admin/subjects/${r}` },
  school_years: { name: "O‘quv yili", href: (r) => `/admin/years/${r}` },
  admission_applications: { name: "Qabul arizasi", href: () => "/admin/applications" },
  telegram_settings: { name: "Telegram", href: () => "/admin/telegram" },
};

// Plain names for the columns most often changed; anything else is shown as is.
const columnNames: Record<string, string> = {
  title: "sarlavha",
  name: "nomi",
  body: "matn",
  description: "tavsif",
  summary: "qisqacha",
  is_published: "ko‘rinishi",
  published_at: "sana",
  starts_at: "boshlanishi",
  ends_at: "tugashi",
  starts_on: "boshlanishi",
  ends_on: "tugashi",
  cover_image: "muqova",
  cover: "muqova",
  cover_photo: "muqova",
  photo: "rasm",
  category: "turkum",
  location: "joyi",
  place: "joyi / o‘rin",
  position: "lavozim",
  subject: "fan",
  full_name: "ism",
  short_name: "eMaktab nomi",
  phone: "telefon",
  email: "email",
  status: "holat",
  admin_note: "maktab izohi",
  homeroom_teacher_id: "sinf rahbari",
  leader_id: "rahbar",
  leader: "rahbar",
  days: "kunlari",
  start_time: "vaqti",
  end_time: "vaqti",
  keyword: "kalit so‘z",
  path: "fayl",
  url: "havola",
  note: "izoh",
  result: "natija",
  winner: "g‘olib",
  names: "o‘quvchi ismi",
  teacher_id: "o‘qituvchi",
  bot_token: "bot tokeni",
  notify_messages: "bildirishnoma",
};
const lang = /_(uz|ru|en)$/;
/** "title_ru" → "sarlavha (ru)"; columns of one field in several languages stay separate so the admin sees which. */
const columnName = (c: string) => {
  const m = c.match(lang);
  const base = m ? c.slice(0, -3) : c;
  const name = columnNames[base] ?? base;
  return m ? `${name} (${m[1]})` : name;
};

export default async function ActivityPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("audit_log")
    .select("id, at, email, table_name, row_ref, action, label, changed")
    .order("at", { ascending: false })
    .order("id", { ascending: false })
    .limit(500);

  const items: ActivityItem[] = (data ?? []).map((r) => {
    const s = sections[r.table_name];
    return {
      id: r.id,
      day: formatDate(r.at, "uz"),
      time: formatTime(r.at, "uz"),
      who: r.email ?? "Noma’lum",
      action: r.action as ActivityItem["action"],
      section: s?.name ?? r.table_name,
      label: r.label || "—",
      href: s && r.row_ref ? s.href(r.row_ref) : null,
      changed: [...new Set(((r.changed as string[] | null) ?? []).map(columnName))],
    };
  });

  return (
    <>
      <AdminHeader title="Faoliyat jurnali" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Qaysi admin qachon nimani qo‘shgani, o‘zgartirgani yoki o‘chirgani (oxirgi 500 ta). Jurnalni baza o‘zi yozadi — uni tahrirlab yoki
        o‘chirib bo‘lmaydi. Telegram kanalidan avtomatik kelganlar va tartibni sudrab o‘zgartirish yozilmaydi.
      </p>
      {items.length ? (
        <ActivityList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali yozuv yo‘q.</p>
      )}
    </>
  );
}
