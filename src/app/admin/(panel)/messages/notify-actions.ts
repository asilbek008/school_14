"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { runTelegramSync, telegram } from "@/lib/telegram-bot";

/** Turns the Telegram notice for new contact messages on or off. */
export async function setMessageNotify(form: FormData) {
  const { supabase } = await requireAdmin();
  const on = form.get("on") === "1";
  const { error } = await supabase.from("telegram_settings").update({ notify_messages: on }).eq("id", 1);
  redirect(`/admin/messages?notify=${error ? "error" : on ? "on" : "off"}`);
}

/** Sends a sample notice now, so the admin sees where notices arrive. */
export async function sendTestNotify() {
  const { supabase } = await requireAdmin();
  const { data: s } = await supabase.from("telegram_settings").select("bot_token, bot_chat_id").eq("id", 1).single();
  let result = "fail";
  if (s?.bot_token && s.bot_chat_id) {
    const sent = await telegram(s.bot_token, "sendMessage", {
      chat_id: s.bot_chat_id,
      text: "✅ Sinov: saytning aloqa formasidan yangi xabar kelganda shu yerga bildirishnoma keladi.",
    });
    if (sent.ok) result = "ok";
  }
  redirect(`/admin/messages?test=${result}`);
}

/** Picks up a fresh Start in the bot now instead of waiting for the next 15-minute check. */
export async function checkNotifyChat() {
  const { supabase } = await requireAdmin();
  await runTelegramSync(supabase);
  redirect("/admin/messages?checked=1");
}
