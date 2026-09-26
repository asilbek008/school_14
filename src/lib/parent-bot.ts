import "server-only";
import type { requireAdmin } from "@/lib/admin";
import { telegram } from "@/lib/telegram-bot";

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
type Hook = { url: string; pending_update_count: number; last_error_date?: number; last_error_message?: string };

export type ParentBotStatus = {
  connected: boolean;
  /** Telegram reaches the bot's webhook (no error in the last hour). */
  healthy: boolean;
  error: string | null;
  username: string | null;
  chats: number;
  subscribed: number;
  withClass: number;
  lastSeen: string | null;
};

const withinHour = (unixSeconds?: number) => !!unixSeconds && unixSeconds * 1000 > Date.now() - 3_600_000;

/** The parents' bot as the admin panel shows it: connected, reachable, and how many chats use it. */
export async function parentBotStatus(supabase: Supabase): Promise<ParentBotStatus> {
  const [{ data: s }, { data: chats }] = await Promise.all([
    supabase.from("telegram_settings").select("parent_bot_token, parent_bot_username").eq("id", 1).maybeSingle(),
    supabase.from("parent_bot_chats").select("subscribed, class_id, last_seen_at").order("last_seen_at", { ascending: false }).limit(10000),
  ]);
  const rows = chats ?? [];
  const token = s?.parent_bot_token ?? null;
  const hook = token ? await telegram<Hook>(token, "getWebhookInfo") : null;
  const error = withinHour(hook?.result?.last_error_date) ? (hook?.result?.last_error_message ?? "xato") : null;
  return {
    connected: !!token,
    healthy: !!hook?.result?.url.endsWith("/functions/v1/parent-bot") && !error,
    error,
    username: token ? (s?.parent_bot_username ?? null) : null,
    chats: rows.length,
    subscribed: rows.filter((r) => r.subscribed).length,
    withClass: rows.filter((r) => r.class_id).length,
    lastSeen: rows[0]?.last_seen_at ?? null,
  };
}
