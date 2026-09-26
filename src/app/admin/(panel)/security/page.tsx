import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import MfaSettings from "./MfaSettings";

export const metadata: Metadata = { title: "Ikki bosqichli kirish" };

/** Turning the authenticator app (2FA) on or off for one's own account. */
export default async function SecurityPage() {
  const { email } = await requireAdmin();
  return (
    <>
      <AdminHeader title="Ikki bosqichli kirish (2FA)" />
      <div className="max-w-2xl space-y-4">
        <p className="text-sm leading-relaxed text-slate-600">
          Yoqilganda <b>{email}</b> hisobiga kirish uchun paroldan tashqari telefoningizdagi ilovadagi 6 xonali kod ham so‘raladi. Parolingiz
          birovga ma’lum bo‘lib qolsa ham, telefoningizsiz panelga kira olmaydi.
        </p>
        <MfaSettings />
      </div>
    </>
  );
}
