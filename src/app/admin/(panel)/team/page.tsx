import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import { roleIcons, roleNames, type StaffRole } from "@/lib/roles";
import { formatDate } from "@/lib/format";
import InviteForm from "./InviteForm";
import { resetMfa, resetTg, revokeInvite, setRole } from "./actions";

export const metadata: Metadata = { title: "Jamoa va ruxsatlar" };

type Member = {
  user_id: string;
  email: string;
  role: StaffRole;
  mfa: boolean;
  tg: boolean;
  /** The first admin — the school's own account. Its role and second step are locked (private.is_owner). */
  owner: boolean;
  last_sign_in_at: string | null;
};

const roles: StaffRole[] = ["admin", "editor", "teacher"];

type Invite = { id: number; email: string; role: StaffRole; token: string | null; expires_at: string; used_at: string | null; invited_email: string | null };

/** Who can sign in to the panel: role (admin / editor), which second step they use; admins change roles here. */
export default async function TeamPage() {
  const { supabase, userId } = await requireAdmin();
  const [{ data }, { data: invited }] = await Promise.all([supabase.rpc("admin_team"), supabase.rpc("staff_invites_list")]);
  const team = (data ?? []) as Member[];
  const invites = (invited ?? []) as Invite[];
  const waiting = invites.filter((i) => !i.used_at);

  return (
    <>
      <AdminHeader title="Jamoa va ruxsatlar" />
      <div className="mb-6 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-slate-900">👑 Admin</p>
          <p className="mt-1 text-slate-600">
            Hamma narsa: murojaatlar, arizalar, xodimlar, dars jadvali, sozlamalar, jurnallar, zaxira nusxalar. Cheklov yo‘q.
            Ro‘yxatdagi birinchi admin — ⭐ super admin: uning roli va ikki bosqichli kirishi boshqalar tomonidan
            o‘zgartirilmaydi, va oxirgi admin pastroq rolga tushirilmaydi.
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-slate-900">✏️ Muharrir</p>
          <p className="mt-1 text-slate-600">Faqat kontent: yangiliklar, tadbirlar, galereya, yutuqlar, doimiy tadbirlar, testlar, kutubxona.</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm md:col-span-2">
          <p className="font-semibold text-slate-900">🎓 O‘qituvchi</p>
          <p className="mt-1 text-slate-600">
            Faqat o‘quv qismi: testlar, savollar bazasi, qisqa darslar va qiyin mavzular statistikasi. Yangilik, xabar, o‘quvchi
            ma’lumotlari va sozlamalarga kira olmaydi.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {team.map((m) => {
          const me = m.user_id === userId;
          return (
            <li key={m.user_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 truncate font-semibold text-slate-900">
                  {m.email} {me && <span className="text-xs font-normal text-slate-500">(siz)</span>}
                  {m.owner && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      ⭐ Super admin (maktab egasi)
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {roleIcons[m.role]} {roleNames[m.role]} ·{" "}
                  {m.tg ? "✈️ Telegram kodi" : m.mfa ? "🔐 Autentifikator ilovasi" : "⚠️ 2FA yo‘q"}
                  {m.last_sign_in_at && ` · oxirgi kirish ${formatDateTime(m.last_sign_in_at, "uz")}`}
                </p>
              </div>
              {m.owner && !me && (
                <p className="text-sm text-slate-500">Super admin hisobi himoyalangan — roli o‘zgartirilmaydi.</p>
              )}
              {!me && !m.owner && (
                <div className="flex flex-wrap gap-2">
                  {roles
                    .filter((r) => r !== m.role)
                    .map((r) => (
                      <form key={r} action={setRole.bind(null, m.user_id, r)}>
                        <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          {roleIcons[r]} {roleNames[r]} qilish
                        </button>
                      </form>
                    ))}
                  {m.tg && (
                    <form action={resetTg.bind(null, m.user_id)}>
                      <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                        Telegramni uzish
                      </button>
                    </form>
                  )}
                  {m.mfa && (
                    <form action={resetMfa.bind(null, m.user_id)}>
                      <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                        Ilova kodini o‘chirish
                      </button>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-4">
        <InviteForm />

        {waiting.length > 0 && (
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Javob kutilmoqda</h2>
            <ul className="divide-y divide-slate-100">
              {waiting.map((invite) => (
                <li key={invite.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{invite.email}</p>
                    <p className="text-sm text-slate-500">
                      {roleIcons[invite.role]} {roleNames[invite.role]} · {formatDate(invite.expires_at, "uz")} gacha
                      {invite.invited_email && ` · taklif qildi: ${invite.invited_email}`}
                    </p>
                  </div>
                  <form action={revokeInvite.bind(null, invite.id)}>
                    <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                      Bekor qilish
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-900">Qanday ishlaydi</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Email va rolni yozib, «Havola yaratish» ni bosing.</li>
            <li>Havolani xodimga yuboring (Telegram, SMS yoki qo‘lda).</li>
            <li>Xodim havolani ochib, o‘ziga parol o‘ylab topadi — parol talablari sahifada ko‘rsatiladi.</li>
            <li>Shu zahoti panelga kira oladi; roli keyin shu yerdan o‘zgartiriladi.</li>
          </ol>
          <p className="mt-2">
            O‘zingizning 2FA sozlamangiz —{" "}
            <Link href="/admin/security" className="font-semibold text-blue-700 hover:underline">
              Ikki bosqichli kirish
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
