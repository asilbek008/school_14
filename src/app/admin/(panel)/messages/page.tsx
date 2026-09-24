import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import MessageList, { type MessageItem } from "./MessageList";
import NotifyCard from "./NotifyCard";

export const metadata: Metadata = { title: "Xabarlar" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const { supabase } = await requireAdmin();
  const [{ data: messages }, { data: tg }, query] = await Promise.all([
    supabase
      .from("contact_messages")
      .select("id, name, email, phone, topic, message, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    // Not the token: only whether a bot and a chat are there.
    supabase.from("telegram_settings").select("bot_username, bot_chat_id, notify_messages").eq("id", 1).maybeSingle(),
    searchParams,
  ]);
  const chatReady = !!tg?.bot_chat_id;
  const flash =
    query.test === "ok"
      ? "Sinov xabari yuborildi — Telegram'ni tekshiring."
      : query.test === "fail"
        ? "✗ Sinov xabarini yuborib bo‘lmadi. Botga Start bosilganini tekshiring."
        : query.notify === "on"
          ? "Bildirishnoma yoqildi."
          : query.notify === "off"
            ? "Bildirishnoma o‘chirildi."
            : query.notify === "error"
              ? "✗ Sozlamani saqlab bo‘lmadi. Qayta urinib ko‘ring."
            : query.checked
              ? chatReady
                ? "Chat ulandi."
                : "✗ Hali Start bosilmagan (yoki Telegram javob bermadi). Bir daqiqadan so‘ng qayta urinib ko‘ring."
              : null;

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
      <NotifyCard s={{ botUsername: tg?.bot_username ?? null, chatReady, on: !!tg?.notify_messages }} flash={flash} />
      {items.length ? (
        <MessageList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali xabar kelmagan.</p>
      )}
    </>
  );
}
