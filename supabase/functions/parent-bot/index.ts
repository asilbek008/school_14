// Webhook of the parents' Telegram bot (see bot.ts), and the news broadcast that pg_cron asks for
// (private.parent_bot_kick). Telegram proves itself with the secret it was given in setWebhook
// (X-Telegram-Bot-Api-Secret-Token); pg_cron sends the same secret as x-bot-secret. Deployed with verify_jwt off.
// Runs with the service role key that Supabase injects, so it bypasses RLS — bot.ts filters published rows itself.

import { createClient } from "npm:@supabase/supabase-js@2";
import { broadcast, handleUpdate, type Tg, type Update } from "./bot.ts";

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: s } = await db.from("telegram_settings").select("parent_bot_token, parent_bot_secret").eq("id", 1).single();
  if (!s?.parent_bot_token || !s.parent_bot_secret) return new Response("not set up", { status: 503 });

  const tg: Tg = async (method, params) => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${s.parent_bot_token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return { ok: false, description: "network" };
    }
  };

  if (req.headers.get("x-telegram-bot-api-secret-token") === s.parent_bot_secret) {
    const update = (await req.json().catch(() => null)) as Update | null;
    if (update) {
      try {
        await handleUpdate(update, db, tg);
      } catch (e) {
        console.error("update failed", e instanceof Error ? e.message : e);
      }
    }
    // Always 200: Telegram would otherwise resend the same update again and again.
    return new Response("ok");
  }
  if (req.headers.get("x-bot-secret") === s.parent_bot_secret) {
    return Response.json(await broadcast(db, tg));
  }
  return new Response("forbidden", { status: 403 });
});
