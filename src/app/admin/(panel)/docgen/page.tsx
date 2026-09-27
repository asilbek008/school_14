import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DocGen from "./DocGen";

export const metadata: Metadata = { title: "Hujjat tayyorlash" };

/** Ma'lumotnoma, tavsifnoma va boshqa bir betlik hujjatlar — brauzerda to‘ldiriladi va PDF bo‘lib chiqadi. */
export default async function DocGenPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Hujjat tayyorlash" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Namunani tanlang, maydonlarni to‘ldiring — hujjat o‘ng tomonda darhol ko‘rinadi va PDF bo‘lib yuklab olinadi. Yozganingiz hech
        qayerga saqlanmaydi (faqat maktab nomi va imzolovchi shu brauzerda eslab qolinadi).
      </p>
      <DocGen />
    </>
  );
}
