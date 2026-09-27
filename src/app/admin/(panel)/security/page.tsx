import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import MfaSettings from "./MfaSettings";
import TgSettings from "./TgSettings";

export const metadata: Metadata = { title: "Ikki bosqichli kirish" };

/** Two ways to do the second step for one's own account: the school's Telegram bot, or an authenticator app. */
export default async function SecurityPage() {
  const { email } = await requireAdmin();
  return (
    <>
      <AdminHeader title="Ikki bosqichli kirish (2FA)" />
      <div className="max-w-2xl space-y-4">
        <p className="text-sm leading-relaxed text-slate-600">
          Yoqilganda <b>{email}</b> hisobiga kirish uchun paroldan tashqari 6 xonali kod ham so‘raladi. Parolingiz birovga ma’lum bo‘lib
          qolsa ham, telefoningizsiz panelga kira olmaydi. Ikki usuldan birini tanlang — Telegram oddiyroq.
        </p>
        <TgSettings />
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-lg">🔐</span>
            <h2 className="font-semibold text-slate-900">Autentifikator ilovasi</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-slate-600">
            Google Authenticator yoki shunga o‘xshash ilova: internet kerak emas, lekin telefon almashsa yoki ilova o‘chirilsa kodni
            tiklash qiyin.
          </p>
          <MfaSettings />
        </div>
      </div>
    </>
  );
}
