"use server";

import { requireAdmin } from "@/lib/admin";
import { runTelegramSync } from "@/lib/telegram-bot";

/**
 * The school's bot has no webhook (telegram-sync reads its updates), so after the admin presses "Start"
 * in Telegram the panel asks for a sync straight away — linking then takes seconds, not the 15 minutes
 * until pg_cron's next run.
 */
export async function checkTelegramLink() {
  const { supabase } = await requireAdmin();
  await runTelegramSync(supabase, "links");
}
