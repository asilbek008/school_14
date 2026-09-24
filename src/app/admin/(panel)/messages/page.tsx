import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import MessageList, { type MessageItem } from "./MessageList";

export const metadata: Metadata = { title: "Xabarlar" };

export default async function MessagesPage() {
  const { supabase } = await requireAdmin();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, topic, message, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const items: MessageItem[] = (messages ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    topic: m.topic,
    message: m.message,
    read: m.is_read,
    date: formatDateTime(m.created_at, "uz"),
    createdAt: m.created_at,
  }));

  return (
    <>
      <AdminHeader title="Aloqa formasidan kelgan xabarlar" />
      {items.length ? (
        <MessageList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali xabar kelmagan.</p>
      )}
    </>
  );
}
