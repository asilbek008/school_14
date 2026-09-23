import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteMessage, setMessageRead } from "./actions";

export const metadata: Metadata = { title: "Xabarlar" };

export default async function MessagesPage() {
  const { supabase } = await requireAdmin();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("is_read")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <AdminHeader title="Aloqa formasidan kelgan xabarlar" />
      {messages?.length ? (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-xl bg-white p-5 shadow-sm ${m.is_read ? "opacity-70" : "border-l-4 border-blue-600"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {m.name}
                  {!m.is_read && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Yangi</span>}
                </p>
                <time className="text-sm text-slate-500">{formatDateTime(m.created_at, "uz")}</time>
              </div>
              <p className="mt-1 space-x-3 text-sm">
                {m.phone && <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="text-blue-700 hover:underline">{m.phone}</a>}
                {m.email && <a href={`mailto:${m.email}`} className="text-blue-700 hover:underline">{m.email}</a>}
              </p>
              <p className="mt-3 whitespace-pre-line text-slate-700">{m.message}</p>
              <div className="mt-4 flex gap-4">
                <form action={setMessageRead.bind(null, m.id, !m.is_read)}>
                  <button className="text-sm text-blue-700 hover:underline">
                    {m.is_read ? "O‘qilmagan deb belgilash" : "O‘qildi deb belgilash"}
                  </button>
                </form>
                <DeleteButton action={deleteMessage.bind(null, m.id)} confirmText="Xabarni o‘chirasizmi?" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali xabar kelmagan.</p>
      )}
    </>
  );
}
