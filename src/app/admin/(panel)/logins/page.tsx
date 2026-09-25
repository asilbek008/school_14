import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import { flagOf, placeName } from "@/lib/geo";
import AdminHeader from "@/components/admin/AdminHeader";
import LoginList, { type LoginItem } from "./LoginList";
import { setLoginNotify } from "./actions";

export const metadata: Metadata = { title: "Kirishlar jurnali" };

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const reasons: Record<string, string> = {
  invalid_credentials: "email yoki parol noto‘g‘ri",
  invalid: "email yoki parol noto‘g‘ri",
  not_admin: "admin ruxsati yo‘q hisob",
  email_not_confirmed: "email tasdiqlanmagan",
  over_request_rate_limit: "juda ko‘p urinish",
  user_banned: "hisob bloklangan",
};

async function load(supabase: Supabase) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [{ data }, { data: tg }] = await Promise.all([
    supabase
      .from("admin_logins")
      .select("id, at, event, email, reason, ip, city, region, country, device")
      .order("at", { ascending: false })
      .order("id", { ascending: false })
      .limit(500),
    supabase.from("telegram_settings").select("bot_chat_id, notify_logins").eq("id", 1).maybeSingle(),
  ]);
  const rows = data ?? [];

  // "New device": the first successful sign-in of an admin from this device and country, oldest first.
  const seen = new Set<string>();
  const isNew = new Map<number, boolean>();
  for (const r of [...rows].reverse()) {
    if (r.event !== "login") continue;
    const key = `${r.email}|${r.device}|${r.country}`;
    const hadBefore = [...seen].some((k) => k.startsWith(`${r.email}|`));
    isNew.set(r.id, hadBefore && !seen.has(key));
    seen.add(key);
  }

  const items: LoginItem[] = rows.map((r) => ({
    id: r.id,
    day: formatDate(r.at, "uz"),
    time: formatTime(r.at, "uz"),
    event: r.event as LoginItem["event"],
    email: r.email ?? "",
    reason: r.event === "failed" ? (reasons[r.reason ?? ""] ?? r.reason) : null,
    place: placeName(r.city, r.region, r.country),
    flag: flagOf(r.country),
    ip: r.ip,
    device: r.device,
    isNew: isNew.get(r.id) ?? false,
  }));

  const recent = rows.filter((r) => r.at >= since);
  const lastLogin = rows.find((r) => r.event === "login");
  return {
    items,
    stats: [
      { label: "Kirishlar (30 kun)", value: String(recent.filter((r) => r.event === "login").length) },
      { label: "Noto‘g‘ri urinishlar (30 kun)", value: String(recent.filter((r) => r.event === "failed").length), warn: recent.some((r) => r.event === "failed") },
      { label: "Turli qurilmalar", value: String(new Set(recent.filter((r) => r.event === "login").map((r) => r.device)).size) },
      { label: "Oxirgi kirish", value: lastLogin ? formatDateTime(lastLogin.at, "uz") : "—", small: true },
    ],
    telegram: { ready: !!tg?.bot_chat_id, on: !!tg?.notify_logins },
  };
}

export default async function LoginsPage() {
  const { supabase } = await requireAdmin();
  const { items, stats, telegram } = await load(supabase);

  return (
    <>
      <AdminHeader title="Kirishlar jurnali" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Admin panelga kim, qachon, qayerdan va qaysi qurilmadan kirgani, noto‘g‘ri parol bilan urinishlar va chiqishlar (oxirgi 500 ta, bir yil
        saqlanadi). Joy IP manzil bo‘yicha taxminan aniqlanadi (shahar/viloyat). Tanimagan kirishni ko‘rsangiz — darhol parolni almashtiring.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 shadow-sm ${s.warn ? "bg-red-50 ring-1 ring-red-200" : "bg-white"}`}>
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`mt-1 font-bold ${s.small ? "text-base" : "text-2xl"} ${s.warn ? "text-red-700" : "text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 text-sm shadow-sm">
        <span className="text-lg">✈</span>
        {telegram.ready ? (
          <>
            <span className="flex-1 text-slate-700">
              Telegram xabari: har kirishda va 5 marta noto‘g‘ri parol kiritilganda —{" "}
              <b className={telegram.on ? "text-green-700" : "text-slate-500"}>{telegram.on ? "yoqilgan" : "o‘chirilgan"}</b>
            </span>
            <form action={setLoginNotify.bind(null, !telegram.on)}>
              <button className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-medium text-slate-700 hover:border-blue-400">
                {telegram.on ? "O‘chirish" : "Yoqish"}
              </button>
            </form>
          </>
        ) : (
          <span className="text-slate-600">
            Kirishlar haqida Telegram xabari olish uchun avval sayt botini ulang («Xabarlar» bo‘limidagi Telegram kartasi).
          </span>
        )}
      </div>

      {items.length ? <LoginList items={items} /> : <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali yozuv yo‘q.</p>}
    </>
  );
}
