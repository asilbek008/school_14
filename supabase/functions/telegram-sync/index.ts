// Imports new posts of the school's public Telegram channel into news and events.
// Called by pg_cron every 15 minutes and by the admin panel ("Hozir yangilash"); both send the
// x-sync-secret header from telegram_settings. `?dry=1` only parses and returns what it would do.
// Runs with the service role key that Supabase injects, so it bypasses RLS.

import { createClient } from "npm:@supabase/supabase-js@2";
import { classify, parseChannelPage, slugFor, type TelegramPost } from "./parse.ts";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: settings, error } = await supabase.from("telegram_settings").select("*").eq("id", 1).single();
  if (error || !settings) return json({ error: "settings" }, 500);
  if (req.headers.get("x-sync-secret") !== settings.sync_secret) return json({ error: "forbidden" }, 403);

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const channel: string | null = (dry && url.searchParams.get("channel")) || settings.channel;
  if (!channel || !/^[A-Za-z0-9_]{4,32}$/.test(channel)) return json({ skipped: "kanal kiritilmagan" });
  if (!dry && !settings.enabled) return json({ skipped: "o‘chirilgan" });

  const finish = async (status: string, extra: Record<string, unknown> = {}) => {
    if (!dry) {
      await supabase
        .from("telegram_settings")
        .update({ last_synced_at: new Date().toISOString(), last_status: status })
        .eq("id", 1);
    }
    return json({ status, ...extra });
  };

  let posts: TelegramPost[];
  try {
    const res = await fetch(`https://t.me/s/${channel}`, { headers: { "User-Agent": "Mozilla/5.0 (school-14 site sync)" } });
    if (!res.ok) return await finish(`Xato: Telegram ${res.status} javob berdi`);
    const html = await res.text();
    if (!html.includes("tgme_channel_info")) {
      return await finish("Xato: kanal topilmadi yoki u yopiq (ochiq kanal bo‘lishi kerak)");
    }
    posts = parseChannelPage(html);
  } catch (e) {
    return await finish(`Xato: Telegram'ga ulanib bo‘lmadi (${e instanceof Error ? e.message : e})`);
  }

  if (dry) {
    return json({ channel, posts: posts.map((p) => ({ id: p.id, date: p.date, images: p.images.length, result: classify(p) })) });
  }

  const { data: seen } = await supabase
    .from("telegram_posts")
    .select("post_id")
    .eq("channel", channel)
    .in("post_id", posts.map((p) => p.id));
  const done = new Set((seen ?? []).map((r) => r.post_id));
  const since = Date.parse(settings.import_since);

  let news = 0;
  let events = 0;
  const problems: string[] = [];
  for (const post of posts) {
    // Older posts are left alone (not recorded), so moving import_since back picks them up.
    if (done.has(post.id) || Date.parse(post.date) < since) continue;
    const result = classify(post);
    const record: Record<string, unknown> = { channel, post_id: post.id };

    if (result.kind === "skip") {
      record.skipped = result.reason;
    } else if (result.kind === "news") {
      const cover = await copyImage(supabase, channel, post);
      const row = {
        title_uz: result.title,
        body_uz: result.body,
        category: result.category,
        cover_image: cover,
        is_published: settings.auto_publish,
        published_at: post.date,
      };
      let { data, error } = await supabase
        .from("news")
        .insert({ ...row, slug: slugFor(result.title, post.id) })
        .select("id")
        .single();
      if (error?.code === "23505") {
        ({ data, error } = await supabase
          .from("news")
          .insert({ ...row, slug: `${slugFor(result.title, post.id)}-${channel.toLowerCase()}` })
          .select("id")
          .single());
      }
      if (error || !data) {
        problems.push(`#${post.id}: ${error?.message}`);
        continue;
      }
      record.news_id = data.id;
      news++;
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert({
          title_uz: result.title,
          description_uz: result.description,
          category: result.category,
          starts_at: result.startsAt,
          ends_at: result.endsAt,
          all_day: result.allDay,
          location: result.location,
          is_published: settings.auto_publish,
        })
        .select("id")
        .single();
      if (error || !data) {
        problems.push(`#${post.id}: ${error?.message}`);
        continue;
      }
      record.event_id = data.id;
      events++;
    }
    const { error: recordError } = await supabase.from("telegram_posts").insert(record);
    if (recordError) problems.push(`#${post.id}: ${recordError.message}`);
  }

  const summary = news || events ? `${news} ta yangilik, ${events} ta tadbir qo‘shildi` : "Yangi post yo‘q";
  return await finish(problems.length ? `${summary}. Xatolar: ${problems.join("; ")}` : summary, { news, events });
});

/** Copies the post's first picture into the media bucket (Telegram's file links are not permanent). */
async function copyImage(
  supabase: ReturnType<typeof createClient>,
  channel: string,
  post: TelegramPost,
): Promise<string | null> {
  const src = post.images[0];
  if (!src) return null;
  try {
    const res = await fetch(src);
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !IMAGE_TYPES.has(type)) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MAX_IMAGE_BYTES) return null;
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const path = `telegram/${channel.toLowerCase()}-${post.id}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, bytes, { contentType: type, upsert: true });
    return error ? null : path;
  } catch {
    return null;
  }
}
