"use server";

import { redirect } from "next/navigation";
import { requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { fromTashkentInput } from "@/lib/format";
import { runTelegramSync, telegram } from "@/lib/telegram-bot";

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
  const status = (await runTelegramSync(supabase)) ? "done" : "error";
  revalidatePublic();
  redirect(`/admin/telegram?synced=${status}`);
}

/**
 * Connects the bot that gives full-quality photos: checks the token, turns off any webhook (the sync
 * reads updates itself) and notes whether the bot is an admin of the channel (`bot_status` "ok" or
 * "not_admin"; without admin rights, posts forwarded to the bot by hand still work).
 */
export async function saveBot(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const token = text(form, "bot_token").replace(/\s+/g, "");
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) {
    return { error: "Token noto‘g‘ri ko‘rinishda. @BotFather bergan to‘liq tokenni nusxalang (masalan 123456789:AAH…)." };
  }
  const me = await telegram<{ id: number; username: string }>(token, "getMe");
  if (!me.ok || !me.result) return { error: `Telegram tokenni qabul qilmadi: ${me.description ?? "noma’lum xato"}` };
  await telegram(token, "deleteWebhook", { drop_pending_updates: false });

  const { data: settings } = await supabase.from("telegram_settings").select("channel").eq("id", 1).single();
  const status = settings?.channel ? await adminStatus(token, settings.channel, me.result.id) : "no_channel";

  const { error } = await supabase
    .from("telegram_settings")
    .update({ bot_token: token, bot_username: me.result.username, bot_status: status })
    .eq("id", 1);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  redirect("/admin/telegram?bot=1");
}

/** Re-checks that the saved bot is still an admin of the channel (after the admin adds it there). */
export async function recheckBot() {
  const { supabase } = await requireAdmin();
  const { data: s } = await supabase.from("telegram_settings").select("channel, bot_token").eq("id", 1).single();
  if (s?.bot_token && s.channel) {
    const me = await telegram<{ id: number; username: string }>(s.bot_token, "getMe");
    const status = me.result ? await adminStatus(s.bot_token, s.channel, me.result.id) : "not_admin";
    await supabase.from("telegram_settings").update({ bot_status: status }).eq("id", 1);
  }
  redirect("/admin/telegram?bot=1");
}

async function adminStatus(token: string, channel: string, botId: number) {
  const member = await telegram<{ status: string }>(token, "getChatMember", { chat_id: `@${channel}`, user_id: botId });
  return member.ok && member.result && ["administrator", "creator"].includes(member.result.status) ? "ok" : "not_admin";
}

export async function removeBot() {
  const { supabase } = await requireAdmin();
  await supabase
    .from("telegram_settings")
    .update({ bot_token: null, bot_username: null, bot_status: null, bot_chat_id: null, bot_offset: 0 })
    .eq("id", 1);
  redirect("/admin/telegram");
}
