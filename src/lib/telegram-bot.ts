import "server-only";
import type { requireAdmin } from "@/lib/admin";

// Server-side calls to the site's Telegram bot (the token stays on the server) and to the sync function.

type TgResult<T> = { ok: boolean; result?: T; description?: string };

export async function telegram<T>(token: string, method: string, params: Record<string, unknown> = {}): Promise<TgResult<T>> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      cache: "no-store",
    });
    return (await res.json()) as TgResult<T>;
  } catch {
    return { ok: false, description: "Telegram bilan bog‘lanib bo‘lmadi" };
  }
}

/** Runs the telegram-sync Edge Function now (the same call pg_cron makes every 15 minutes). */
export async function runTelegramSync(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"]): Promise<boolean> {
  const { data: settings } = await supabase.from("telegram_settings").select("sync_secret").eq("id", 1).single();
  if (!settings) return false;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/telegram-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sync-secret": settings.sync_secret },
      body: "{}",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
