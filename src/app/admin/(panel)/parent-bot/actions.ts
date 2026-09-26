"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { telegram } from "@/lib/telegram-bot";

// The parents' bot answers through a webhook to the parent-bot Edge Function; Telegram sends back the secret given
// here in every request (the function checks it). The commands below are the ones bot.ts answers.
const commands = [
  { command: "darslar", description: "Bugungi darslar (masalan: /darslar 8-A)" },
  { command: "ertaga", description: "Ertangi darslar" },
  { command: "sinf", description: "Sinfni tanlash" },
  { command: "yangiliklar", description: "So‘nggi yangiliklar" },
  { command: "tadbirlar", description: "Yaqin tadbirlar" },
  { command: "obuna", description: "Yangiliklarni olish / to‘xtatish" },
  { command: "aloqa", description: "Maktab bilan bog‘lanish" },
];

const webhookUrl = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/parent-bot`;

async function connect(token: string, secret: string) {
  const hook = await telegram(token, "setWebhook", {
    url: webhookUrl(),
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  if (!hook.ok) return hook.description ?? "noma’lum xato";
  await telegram(token, "setMyCommands", { commands });
  await telegram(token, "setMyDescription", {
    description:
      "Qiziriq tumani 14-maktabining ota-onalar uchun boti: farzandingiz sinfining bugungi va ertangi darslari, maktab yangiliklari va tadbirlari. Shaxsiy ma’lumot so‘ralmaydi.",
  });
  await telegram(token, "setMyShortDescription", { short_description: "14-maktab: dars jadvali, yangiliklar, tadbirlar" });
  return null;
}

/** Connects the parents' bot: checks the token, sets the webhook, commands and description. */
export async function saveParentBot(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const token = text(form, "parent_bot_token").replace(/\s+/g, "");
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) {
    return { error: "Token noto‘g‘ri ko‘rinishda. @BotFather bergan to‘liq tokenni nusxalang (masalan 123456789:AAH…)." };
  }
  const { data: s } = await supabase.from("telegram_settings").select("bot_token").eq("id", 1).single();
  if (s?.bot_token === token) {
    return { error: "Bu — kanal uchun ulangan sayt boti. Ota-onalar uchun @BotFather’da yangi bot yarating va uning tokenini kiriting." };
  }
  const me = await telegram<{ id: number; username: string }>(token, "getMe");
  if (!me.ok || !me.result) return { error: `Telegram tokenni qabul qilmadi: ${me.description ?? "noma’lum xato"}` };

  const secret = randomBytes(24).toString("hex");
  // Saved first: the first update may arrive right after setWebhook.
  const { error } = await supabase
    .from("telegram_settings")
    .update({ parent_bot_token: token, parent_bot_username: me.result.username, parent_bot_secret: secret })
    .eq("id", 1);
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  const failed = await connect(token, secret);
  if (failed) return { error: `Webhook o‘rnatilmadi: ${failed}` };
  revalidatePublic();
  redirect("/admin/parent-bot?saved=1");
}

/** Sets the webhook again (after an error shown on the page). */
export async function reconnectParentBot() {
  const { supabase } = await requireAdmin();
  const { data: s } = await supabase.from("telegram_settings").select("parent_bot_token, parent_bot_secret").eq("id", 1).single();
  if (s?.parent_bot_token && s.parent_bot_secret) await connect(s.parent_bot_token, s.parent_bot_secret);
  redirect("/admin/parent-bot?saved=1");
}

export async function removeParentBot() {
  const { supabase } = await requireAdmin();
  const { data: s } = await supabase.from("telegram_settings").select("parent_bot_token").eq("id", 1).single();
  if (s?.parent_bot_token) await telegram(s.parent_bot_token, "deleteWebhook", { drop_pending_updates: true });
  await supabase.from("telegram_settings").update({ parent_bot_token: null, parent_bot_username: null, parent_bot_secret: null }).eq("id", 1);
  revalidatePublic();
  redirect("/admin/parent-bot");
}
