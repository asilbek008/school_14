"use server";

import { redirect } from "next/navigation";
import { requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { fromTashkentInput } from "@/lib/format";

/** "@maktab14", "https://t.me/maktab14", "t.me/s/maktab14" → "maktab14". */
function channelName(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^(t\.me|telegram\.me)\/(s\/)?/, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
}

export async function saveTelegram(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const channel = channelName(text(form, "channel")) || null;
  if (channel && !/^[A-Za-z0-9_]{4,32}$/.test(channel)) {
    return { error: "Kanal nomi noto‘g‘ri. Masalan: @maktab14 yoki https://t.me/maktab14" };
  }
  const enabled = form.get("enabled") === "on";
  if (enabled && !channel) return { error: "Avval kanal nomini kiriting." };
  const since = fromTashkentInput(text(form, "import_since"));
  if (!since) return { error: "Qaysi sanadan boshlab olishni kiriting." };

  const { error } = await supabase
    .from("telegram_settings")
    .update({ channel, enabled, auto_publish: form.get("auto_publish") === "on", import_since: since })
    .eq("id", 1);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  redirect("/admin/telegram?saved=1");
}

/** Runs the telegram-sync Edge Function now (the same call pg_cron makes every 15 minutes). */
export async function syncTelegramNow() {
  const { supabase } = await requireAdmin();
  const { data: settings } = await supabase.from("telegram_settings").select("sync_secret").eq("id", 1).single();
  let status = "error";
  if (settings) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/telegram-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sync-secret": settings.sync_secret },
        body: "{}",
        cache: "no-store",
      });
      if (res.ok) status = "done";
    } catch {}
  }
  revalidatePublic();
  redirect(`/admin/telegram?synced=${status}`);
}
