import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import TrustList, { type TrustItem } from "./TrustList";

export const metadata: Metadata = { title: "Ishonch qutisi" };

export default async function AdminTrustPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("trust_messages")
    .select("id, topic, message, contact, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const items: TrustItem[] = (data ?? []).map((m) => ({
    id: m.id,
    topic: m.topic,
    message: m.message,
    contact: m.contact,
    read: m.is_read,
    date: formatDateTime(m.created_at, "uz"),
  }));

  return (
    <>
      <AdminHeader title="Ishonch qutisi" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «Ishonch qutisi» orqali kelgan maxfiy murojaatlar. Yuboruvchining ismi, telefoni va IP manzili saqlanmaydi — faqat matn va
        mavzu. Aloqa maydoni to‘ldirilgan bo‘lsagina javob berish mumkin.
      </p>
      {items.length ? (
        <TrustList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali murojaat kelmagan.</p>
      )}
    </>
  );
}
