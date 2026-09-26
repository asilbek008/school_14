import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import { resetMfa, setRole } from "./actions";

export const metadata: Metadata = { title: "Jamoa va ruxsatlar" };

type Member = { user_id: string; email: string; role: "admin" | "editor"; mfa: boolean; last_sign_in_at: string | null };

/** Who can sign in to the panel: role (admin / editor), 2FA state; admins change roles here. */
export default async function TeamPage() {
  const { supabase, userId } = await requireAdmin();
  const { data } = await supabase.rpc("admin_team");
  const team = (data ?? []) as Member[];

  return (
    <>
      <AdminHeader title="Jamoa va ruxsatlar" />
      <div className="mb-6 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-slate-900">👑 Admin</p>
          <p className="mt-1 text-slate-600">Hamma narsa: murojaatlar, arizalar, xodimlar, dars jadvali, sozlamalar, jurnallar, zaxira nusxalar.</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-slate-900">✏️ Muharrir</p>
          <p className="mt-1 text-slate-600">Faqat kontent: yangiliklar, tadbirlar, galereya, yutuqlar, doimiy tadbirlar, testlar, kutubxona.</p>
        </div>
      </div>

      <ul className="space-y-3">
        {team.map((m) => {
          const me = m.user_id === userId;
          return (
            <li key={m.user_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {m.email} {me && <span className="text-xs font-normal text-slate-500">(siz)</span>}
                </p>
                <p className="text-sm text-slate-500">
                  {m.role === "admin" ? "👑 Admin" : "✏️ Muharrir"} · {m.mfa ? "🔐 2FA yoqilgan" : "⚠️ 2FA yo‘q"}
                  {m.last_sign_in_at && ` · oxirgi kirish ${formatDateTime(m.last_sign_in_at, "uz")}`}
                </p>
              </div>
              {!me && (
                <div className="flex flex-wrap gap-2">
                  <form action={setRole.bind(null, m.user_id, m.role === "admin" ? "editor" : "admin")}>
                    <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      {m.role === "admin" ? "Muharrir qilish" : "Admin qilish"}
                    </button>
                  </form>
                  {m.mfa && (
                    <form action={resetMfa.bind(null, m.user_id)}>
                      <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">2FA’ni o‘chirish</button>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 rounded-xl bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
        <p className="font-semibold text-slate-900">Yangi xodim qo‘shish</p>
        <p className="mt-1">
          Supabase Dashboard → Authentication → Add user (email va parol) orqali hisob oching, keyin dasturchiga email’ni yuboring — u hisobni
          admin yoki muharrir qilib qo‘shadi. O‘zingizning 2FA sozlamangiz —{" "}
          <Link href="/admin/security" className="font-semibold text-blue-700 hover:underline">
            Ikki bosqichli kirish
          </Link>
          .
        </p>
      </div>
    </>
  );
}
