// Imports new posts of the school's public Telegram channel into news and events.
// Called by pg_cron every 15 minutes and by the admin panel ("Hozir tekshirish"); both send the
// x-sync-secret header from telegram_settings. `?dry=1` only parses and returns what it would do
// (with `&channel=` and `&since=` to preview another channel or period).
// Runs with the service role key that Supabase injects, so it bypasses RLS.
//
// Photo quality: the public preview (t.me/s) only has ~800px copies. When a bot token is set and the
// bot is an admin of the channel, getUpdates delivers new posts with their original photos, and old
// posts are forwarded once to a private chat with the bot (someone pressed Start there) to read theirs.
// Articles made from preview copies are then upgraded a few at a time (`telegram_posts.hd`).

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { classify, oldestPostId, parseChannelPage, postPhotos, slugFor, type TelegramPost } from "./parse.ts";

const TG = "https://api.telegram.org";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** A preview page holds only a few posts when they have photo albums; go back at most this many pages. */
const MAX_PAGES = 8;
/** Photos copied per post: the first is the cover, the rest go to the article's gallery. */
const MAX_PHOTOS = 12;
/** Articles upgraded to original photos per run, and old messages forwarded per run. */
const UPGRADE_BATCH = 6;
const FORWARD_BUDGET = 40;

type Settings = {
  channel: string | null;
  enabled: boolean;
  auto_publish: boolean;
  import_since: string;
  sync_secret: string;
  bot_token: string | null;
  bot_offset: number;
  bot_chat_id: number | null;
};
type Media = { file_id: string; width: number | null; height: number | null };
type TgPhoto = { file_id: string; width: number; height: number };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: settings, error } = await supabase.from("telegram_settings").select("*").eq("id", 1).single<Settings>();
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

  // A dry run may look further back (?since=2026-09-01) to preview a new channel.
  const since = Date.parse((dry && url.searchParams.get("since")) || settings.import_since);
  const byId = new Map<number, TelegramPost>();
  try {
    let before: number | null = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await fetch(`https://t.me/s/${channel}${before ? `?before=${before}` : ""}`, {
        headers: { "User-Agent": "Mozilla/5.0 (school-14 site sync)" },
      });
      if (!res.ok) return await finish(`Xato: Telegram ${res.status} javob berdi`);
      const html = await res.text();
      if (page === 0 && !html.includes("tgme_channel_info")) {
        return await finish("Xato: kanal topilmadi yoki u yopiq (ochiq kanal bo‘lishi kerak)");
      }
      const pagePosts = parseChannelPage(html);
      for (const post of pagePosts) byId.set(post.id, post);
      before = oldestPostId(html);
      // Stop once the page reaches posts older than import_since.
      if (!before || !pagePosts.length || Date.parse(pagePosts[0].date) < since) break;
    }
  } catch (e) {
    return await finish(`Xato: Telegram'ga ulanib bo‘lmadi (${e instanceof Error ? e.message : e})`);
  }
  const posts = [...byId.values()].sort((a, b) => a.id - b.id);

  if (dry) {
    return json({ channel, posts: posts.map((p) => ({ id: p.id, date: p.date, images: p.images.length, result: classify(p) })) });
  }

  const bot = settings.bot_token ? new Bot(supabase, settings.bot_token, channel) : null;
  if (bot) await bot.collectUpdates(settings);
  const media = await loadMedia(supabase, channel);
  const photos = new PhotoCopier(supabase, channel, bot, media);

  const { data: seen } = await supabase
    .from("telegram_posts")
    .select("post_id")
    .eq("channel", channel)
    .in("post_id", posts.map((p) => p.id));
  const done = new Set((seen ?? []).map((r) => r.post_id));

  let news = 0;
  let events = 0;
  const problems: string[] = [];
  for (const post of posts) {
    // Older posts are left alone (not recorded), so moving import_since back picks them up.
    if (done.has(post.id) || Date.parse(post.date) < since) continue;
    const result = classify(post);
    const record: Record<string, unknown> = { channel, post_id: post.id, photo_ids: post.photoIds };

    if (result.kind === "skip") {
      record.skipped = result.reason;
    } else if (result.kind === "news") {
      const copied = await photos.copyAll(post.id, post.photoIds, post.images);
      const row = {
        title_uz: result.title,
        body_uz: result.body,
        category: result.category,
        cover_image: copied.paths[0] ?? null,
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
      await setGallery(supabase, data.id, copied.paths.slice(1));
      record.news_id = data.id;
      record.hd = copied.hd;
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

  const upgraded = bot ? await upgradeOld(supabase, channel, bot, byId, settings.bot_chat_id) : 0;

  const summary = news || events ? `${news} ta yangilik, ${events} ta tadbir qo‘shildi` : "Yangi post yo‘q";
  const hd = upgraded ? `; ${upgraded} ta yangilik rasmlari asl sifatga almashtirildi` : "";
  return await finish(problems.length ? `${summary}${hd}. Xatolar: ${problems.join("; ")}` : summary + hd, { news, events, upgraded });
});

/** Telegram Bot API calls for the channel's bot. */
class Bot {
  constructor(
    private supabase: SupabaseClient,
    private token: string,
    private channel: string,
  ) {}

  async call<T>(method: string, params: Record<string, unknown>): Promise<T | null> {
    try {
      const res = await fetch(`${TG}/bot${this.token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data?.ok ? (data.result as T) : null;
    } catch {
      return null;
    }
  }

  fileUrl(path: string) {
    return `${TG}/file/bot${this.token}/${path}`;
  }

  /** New channel posts (with original photos) and "/start" from the private chat used for old posts. */
  async collectUpdates(settings: Settings) {
    type Update = {
      update_id: number;
      channel_post?: { message_id: number; chat: { username?: string }; photo?: TgPhoto[] };
      edited_channel_post?: { message_id: number; chat: { username?: string }; photo?: TgPhoto[] };
      message?: { chat: { id: number; type: string }; text?: string };
    };
    const updates = await this.call<Update[]>("getUpdates", {
      offset: settings.bot_offset,
      timeout: 0,
      allowed_updates: ["channel_post", "edited_channel_post", "message"],
    });
    if (!updates?.length) return;
    const rows = [];
    let chatId = settings.bot_chat_id;
    for (const u of updates) {
      const post = u.channel_post ?? u.edited_channel_post;
      if (post?.photo?.length && post.chat.username?.toLowerCase() === this.channel.toLowerCase()) {
        rows.push({ channel: this.channel, message_id: post.message_id, ...largest(post.photo) });
      }
      if (u.message?.chat.type === "private" && u.message.text?.startsWith("/start")) {
        chatId = u.message.chat.id;
        await this.call("sendMessage", {
          chat_id: chatId,
          text: "✅ Bot saytga ulandi. Kanaldagi eski postlarning asl sifatli rasmlari shu chat orqali olinadi — bu yerga vaqtincha xabarlar tushib, darhol o‘chiriladi.",
        });
      }
    }
    if (rows.length) await this.supabase.from("telegram_media").upsert(rows);
    await this.supabase
      .from("telegram_settings")
      .update({ bot_offset: updates[updates.length - 1].update_id + 1, bot_chat_id: chatId })
      .eq("id", 1);
  }

  /** Reads an old message's original photo by forwarding it to the private chat, then deletes the copy. */
  async fetchOld(messageId: number, chatId: number): Promise<Media | null> {
    const copy = await this.call<{ message_id: number; photo?: TgPhoto[] }>("forwardMessage", {
      chat_id: chatId,
      from_chat_id: `@${this.channel}`,
      message_id: messageId,
      disable_notification: true,
    });
    if (!copy) return null;
    await this.call("deleteMessage", { chat_id: chatId, message_id: copy.message_id });
    if (!copy.photo?.length) return null;
    const best = largest(copy.photo);
    await this.supabase.from("telegram_media").upsert({ channel: this.channel, message_id: messageId, ...best });
    return best;
  }
}

function largest(photo: TgPhoto[]): Media {
  const best = photo.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
  return { file_id: best.file_id, width: best.width, height: best.height };
}

async function loadMedia(supabase: SupabaseClient, channel: string): Promise<Map<number, Media>> {
  const { data } = await supabase.from("telegram_media").select("message_id, file_id, width, height").eq("channel", channel);
  return new Map((data ?? []).map((m) => [m.message_id, { file_id: m.file_id, width: m.width, height: m.height }]));
}

/** Copies a post's photos into the media bucket (Telegram's links are not permanent). */
class PhotoCopier {
  constructor(
    private supabase: SupabaseClient,
    private channel: string,
    private bot: Bot | null,
    private media: Map<number, Media>,
  ) {}

  /** Originals where the bot has them, else the preview copies; `hd` = every photo is an original. */
  async copyAll(postId: number, ids: number[], previews: string[]): Promise<{ paths: string[]; hd: boolean }> {
    const paths: string[] = [];
    let hd = true;
    const count = Math.min(Math.max(ids.length, previews.length), MAX_PHOTOS);
    for (let i = 0; i < count; i++) {
      // A video's preview frame has no message id and no original to wait for.
      const original = ids[i] === undefined ? null : await this.originalUrl(ids[i]);
      if (!original && ids[i] !== undefined) hd = false;
      const src = original ?? previews[i];
      const path = src ? await this.copy(src, `${this.channel.toLowerCase()}-${postId}${original ? "-hd" : ""}${i ? `-${i}` : ""}`) : null;
      if (path) paths.push(path);
    }
    return { paths, hd };
  }

  private async originalUrl(messageId: number): Promise<string | null> {
    const m = this.media.get(messageId);
    if (!m || !this.bot) return null;
    const file = await this.bot.call<{ file_path?: string }>("getFile", { file_id: m.file_id });
    return file?.file_path ? this.bot.fileUrl(file.file_path) : null;
  }

  private async copy(src: string, name: string): Promise<string | null> {
    try {
      const res = await fetch(src);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const type = sniffImage(bytes);
      if (!type || bytes.byteLength > MAX_IMAGE_BYTES) return null;
      const path = `telegram/${name}.${type.split("/")[1].replace("jpeg", "jpg")}`;
      const { error } = await this.supabase.storage.from("media").upload(path, bytes, { contentType: type, upsert: true });
      return error ? null : path;
    } catch {
      return null;
    }
  }
}

/** Image type from the file's first bytes (Telegram's file server does not always send one). */
function sniffImage(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return "image/webp";
  return null;
}

/** Replaces an article's Telegram photos (admin-added ones stay). */
async function setGallery(supabase: SupabaseClient, newsId: number, paths: string[], replace = false) {
  if (replace) {
    const { data: old } = await supabase.from("news_photos").select("id, path").eq("news_id", newsId).like("path", "telegram/%");
    if (old?.length) {
      await supabase.from("news_photos").delete().in("id", old.map((p) => p.id));
      await supabase.storage.from("media").remove(old.map((p) => p.path));
    }
  }
  if (paths.length) {
    await supabase.from("news_photos").insert(paths.map((path, i) => ({ news_id: newsId, path, sort_order: i + 1 })));
  }
}

/** Swaps preview copies for originals in articles imported before the bot had them. */
async function upgradeOld(
  supabase: SupabaseClient,
  channel: string,
  bot: Bot,
  parsed: Map<number, TelegramPost>,
  chatId: number | null,
): Promise<number> {
  const { data: pending } = await supabase
    .from("telegram_posts")
    .select("post_id, news_id, photo_ids, news(cover_image)")
    .eq("channel", channel)
    .eq("hd", false)
    .not("news_id", "is", null)
    .order("post_id", { ascending: false })
    .limit(UPGRADE_BATCH);
  const media = await loadMedia(supabase, channel);
  let forwards = FORWARD_BUDGET;
  let upgraded = 0;

  for (const row of pending ?? []) {
    let ids: number[] | null = row.photo_ids ?? parsed.get(row.post_id)?.photoIds ?? null;
    if (!ids) ids = await photoIdsOf(channel, row.post_id);
    if (!ids) continue;
    if (!row.photo_ids) await supabase.from("telegram_posts").update({ photo_ids: ids }).eq("channel", channel).eq("post_id", row.post_id);
    if (!ids.length) {
      // No photos to upgrade (e.g. a video post): leave the article as it is.
      await supabase.from("telegram_posts").update({ hd: true }).eq("channel", channel).eq("post_id", row.post_id);
      continue;
    }

    for (const id of ids) {
      if (media.has(id) || !chatId || forwards <= 0) continue;
      forwards--;
      const m = await bot.fetchOld(id, chatId);
      if (m) media.set(id, m);
    }
    if (!ids.every((id) => media.has(id))) continue;

    const copier = new PhotoCopier(supabase, channel, bot, media);
    const { paths, hd } = await copier.copyAll(row.post_id, ids, []);
    // Only swap when every original was copied, so a failed download never loses a photo.
    if (!hd || paths.length !== Math.min(ids.length, MAX_PHOTOS)) continue;
    const news = row.news as unknown as { cover_image: string | null } | null;
    const oldCover = news?.cover_image ?? null;
    // Keep a cover the admin chose by hand; only Telegram's own cover is replaced.
    if (paths[0] && (!oldCover || oldCover.startsWith("telegram/"))) {
      await supabase.from("news").update({ cover_image: paths[0] }).eq("id", row.news_id);
      if (oldCover && oldCover !== paths[0]) await supabase.storage.from("media").remove([oldCover]);
    }
    await setGallery(supabase, row.news_id, paths.slice(1), true);
    await supabase.from("telegram_posts").update({ hd: true }).eq("channel", channel).eq("post_id", row.post_id);
    upgraded++;
  }
  return upgraded;
}

/** Photo message ids of one post, from its embed page (for posts no longer on the preview pages). */
async function photoIdsOf(channel: string, postId: number): Promise<number[] | null> {
  try {
    const res = await fetch(`https://t.me/${channel}/${postId}?embed=1&mode=tme`);
    if (!res.ok) return null;
    const ids = postPhotos(await res.text()).map((p) => p.id);
    return ids.length ? ids : [];
  } catch {
    return null;
  }
}
