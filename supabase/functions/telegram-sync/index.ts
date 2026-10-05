// Imports new posts of the school's public Telegram channel into news and events.
// Called by pg_cron every 15 minutes and by the admin panel ("Hozir tekshirish"); both send the
// x-sync-secret header from telegram_settings. `?dry=1` only parses and returns what it would do
// (with `&channel=` and `&since=` to preview another channel or period).
// Runs with the service role key that Supabase injects, so it bypasses RLS.
//
// Photo quality: the preview grid (t.me/s) links ~800px copies, and that is the best a public channel
// page offers -- the photo page's og:image was tried and is a 320px thumbnail, smaller still, so it is
// not used. The only larger source is the bot: an original through getFile, which needs the bot to be
// an admin of the channel (or the post forwarded to it by hand). Every copy therefore tries the bot's
// original first and falls back to the preview link, measures what it got, and keeps the bigger of the
// two -- a copy is never replaced by a smaller one. `telegram_posts.photo_px` records the long side of
// the post's smallest photo, so the panel can say what the site really holds rather than guessing, and
// `hd` means "every photo is at least HD_PX wide".
//
// Videos: the preview page carries the file itself only while the video is small; a longer one answers
// "Media is too big", and no bot can fetch it either (the Bot API caps getFile at 20 MB). A small video
// is copied into the bucket; a big one becomes a link to the post, with the thumbnail we copied. Both
// land in the site's video section, joined to the article when the post also became news.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { classify, htmlToText, imageSize, oldestPostId, parseChannelPage, postPhotos, postVideos, slugFor, type TelegramPost, type TelegramVideo } from "./parse.ts";

const TG = "https://api.telegram.org";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** The media bucket refuses more than 50 MB; stay under it. A longer video becomes a Telegram link. */
const MAX_VIDEO_BYTES = 45 * 1024 * 1024;
/** Long side a photo needs for a phone's full-screen view to stay sharp. The bot's originals clear it,
 * the preview grid's ~800px copies do not, so this tells a real original from a stand-in. */
const HD_PX = 1000;
/** A preview page holds only a few posts when they have photo albums; go back at most this many pages. */
const MAX_PAGES = 8;
/** Photos copied per post: the first is the cover, the rest go to the article's gallery. */
const MAX_PHOTOS = 12;
/** Articles upgraded to original photos per run, and old messages forwarded per run. */
const UPGRADE_BATCH = 6;
/** What the public preview grid serves. A post already holding copies this big has nothing more to
 * gain from the channel page; only the bot can do better. */
const PREVIEW_PX = 800;
/** How many times a post is re-fetched from the channel page before it is left alone. */
const MAX_PHOTO_TRIES = 2;
/** Posts looked at per run for videos they were imported without, and videos copied per run. */
const VIDEO_BACKFILL_SCAN = 100;
const VIDEO_BACKFILL_BATCH = 4;
const FORWARD_BUDGET = 40;
/** Not-yet-upgraded articles looked at per run, and embed pages fetched for their photo ids. */
const UPGRADE_SCAN = 100;
const EMBED_BUDGET = 10;

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
  // ?links=1 — only the bot's own updates, for the admin panel's "Botga ulash" (no channel reading).
  if (url.searchParams.get("links") === "1") {
    if (!settings.bot_token) return json({ error: "no bot" }, 400);
    await new Bot(supabase, settings.bot_token, settings.channel ?? "").collectUpdates(settings);
    return json({ status: "links" });
  }
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
    return json({
      channel,
      posts: posts.map((p) => ({
        id: p.id,
        date: p.date,
        images: p.images.length,
        videos: p.videos.map((v) => ({ id: v.id, file: !!v.url, seconds: v.duration })),
        result: classify(p),
      })),
    });
  }

  const bot = settings.bot_token ? new Bot(supabase, settings.bot_token, channel) : null;
  if (bot) await bot.collectUpdates(settings);
  const media = await loadMedia(supabase, channel);
  const photos = new PhotoCopier(supabase, channel, bot, media);
  const videos = new VideoImporter(supabase, channel);

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
      // A post skipped for being short or wordless may still be a video worth showing, but the channel's
      // own filter already said it is not article material -- so it is stored hidden for an admin to
      // look at, never published on its own. One tagged #saytga_emas is not taken at all.
      if (result.reason !== "#saytga_emas") {
        const added = await videos.importAll(post, { title: null, body: post.text || null, category: null, newsId: null }, false);
        if (added) record.video_id = added;
      }
      record.videos_done = true;
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
      record.photo_px = copied.px;
      news++;
      const added = await videos.importAll(post, { title: result.title, body: result.body, category: result.category, newsId: data.id }, settings.auto_publish);
      if (added) record.video_id = added;
      record.videos_done = true;
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
      const added = await videos.importAll(post, { title: result.title, body: result.description, category: null, newsId: null }, settings.auto_publish);
      if (added) record.video_id = added;
      record.videos_done = true;
    }
    const { error: recordError } = await supabase.from("telegram_posts").insert(record);
    if (recordError) problems.push(`#${post.id}: ${recordError.message}`);
  }

  // Posts imported before videos were supported: a batch per run goes back for theirs.
  await backfillVideos(supabase, channel, videos, byId, settings.auto_publish);
  const upgraded = await upgradePhotos(supabase, channel, bot, byId, settings.bot_chat_id);

  // One counter for both passes: the backfill stores through the same importer.
  const added = videos.count;
  const summary = news || events ? `${news} ta yangilik, ${events} ta tadbir qo‘shildi` : "Yangi post yo‘q";
  const vid = added ? `; ${added} ta video olindi` : "";
  const hd = upgraded ? `; ${upgraded} ta yangilik rasmlari kattaroq nusxaga almashtirildi` : "";
  return await finish(problems.length ? `${summary}${vid}${hd}. Xatolar: ${problems.join("; ")}` : summary + vid + hd, {
    news,
    events,
    videos: added,
    upgraded,
  });
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

  /** Original photos of channel posts (bot is admin) and of posts forwarded to the bot, and "/start". */
  async collectUpdates(settings: Settings) {
    type Update = {
      update_id: number;
      channel_post?: { message_id: number; chat: { username?: string }; photo?: TgPhoto[] };
      edited_channel_post?: { message_id: number; chat: { username?: string }; photo?: TgPhoto[] };
      message?: {
        chat: { id: number; type: string };
        text?: string;
        photo?: TgPhoto[];
        forward_origin?: { type: string; chat?: { username?: string }; message_id?: number };
      };
    };
    const updates = await this.call<Update[]>("getUpdates", {
      offset: settings.bot_offset,
      timeout: 0,
      allowed_updates: ["channel_post", "edited_channel_post", "message"],
    });
    if (!updates?.length) return;
    const rows = [];
    let chatId = settings.bot_chat_id;
    const ours = (chat?: { username?: string }) => chat?.username?.toLowerCase() === this.channel.toLowerCase();
    // Photos forwarded by hand, per private chat, to thank the sender once.
    const received = new Map<number, number>();
    const foreign = new Set<number>();
    for (const u of updates) {
      const post = u.channel_post ?? u.edited_channel_post;
      if (post?.photo?.length && ours(post.chat)) {
        rows.push({ channel: this.channel, message_id: post.message_id, ...largest(post.photo) });
      }
      const msg = u.message;
      if (msg?.chat.type === "private" && (msg.forward_origin || msg.photo?.length)) {
        // forward_origin is set by Telegram, so a photo with our channel as origin is the channel's own.
        // A forward "without author" has no origin, so it cannot be matched to a post.
        const origin = msg.forward_origin;
        if (origin?.type === "channel" && ours(origin.chat) && origin.message_id && msg.photo?.length) {
          rows.push({ channel: this.channel, message_id: origin.message_id, ...largest(msg.photo) });
          received.set(msg.chat.id, (received.get(msg.chat.id) ?? 0) + 1);
        } else if (origin?.type !== "channel" || !ours(origin.chat)) {
          foreign.add(msg.chat.id);
        }
      }
      // The admin panel's second step: "Botga ulash" in "Ikki bosqichli kirish" sends /start admin_<token>.
      const link = msg?.chat.type === "private" ? /^\/start\s+admin_([0-9a-f]{32})$/.exec(msg.text ?? "") : null;
      if (link) {
        const { data } = await this.supabase.rpc("admin_tg_claim", { p_token: link[1], p_chat_id: msg!.chat.id });
        const claim = data as { ok?: boolean; email?: string } | null;
        await this.call("sendMessage", {
          chat_id: msg!.chat.id,
          text: claim?.ok
            ? `✅ Admin panel shu Telegramga ulandi${claim.email ? ` (${claim.email})` : ""}.\nEndi har kirishda 6 xonali kod shu chatga keladi. Kodni hech kimga bermang.`
            : "⚠️ Havola eskirgan. Admin panelda «Botga ulash» tugmasini qaytadan bosing.",
        });
        continue;
      }
      if (msg?.chat.type === "private" && msg.text?.startsWith("/start")) {
        chatId = msg.chat.id;
        await this.call("sendMessage", {
          chat_id: chatId,
          text: `✅ Bot saytga ulandi. @${this.channel} kanalidagi rasmli postlarni shu yerga forward qilsangiz, sayt ularning asl sifatli rasmlarini oladi. (Bot kanalda admin bo‘lsa, bu avtomatik bo‘ladi — shu chatga vaqtincha xabarlar tushib, darhol o‘chiriladi.)`,
        });
      }
    }
    if (rows.length) await this.supabase.from("telegram_media").upsert(rows);
    for (const [chat, n] of received) {
      await this.call("sendMessage", {
        chat_id: chat,
        text: `✅ ${n} ta rasm asl sifatda olindi. Saytdagi yangilik keyingi tekshiruvda (15 daqiqagacha) yangilanadi.`,
      });
    }
    for (const chat of foreign) {
      if (received.has(chat)) continue;
      await this.call("sendMessage", {
        chat_id: chat,
        text: `Faqat @${this.channel} kanalidagi rasmli postlarni forward qiling («Muallifsiz yuborish»ni yoqmang).`,
      });
    }
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

  /**
   * Copies each photo at the best size available and reports what was stored: `px` is the long side of
   * the smallest one, `hd` whether every one reached HD_PX.
   */
  async copyAll(postId: number, ids: number[], previews: string[]): Promise<{ paths: string[]; hd: boolean; px: number | null }> {
    const paths: string[] = [];
    let smallest: number | null = null;
    const count = Math.min(Math.max(ids.length, previews.length), MAX_PHOTOS);
    for (let i = 0; i < count; i++) {
      // A video's preview frame has no message of its own, so it has only the preview link.
      const stored = await this.copyBest(ids[i], previews[i], `${this.channel.toLowerCase()}-${postId}`, i);
      if (!stored) continue;
      paths.push(stored.path);
      smallest = smallest === null ? stored.px : Math.min(smallest, stored.px);
    }
    return { paths, hd: smallest !== null && smallest >= HD_PX, px: smallest };
  }

  /**
   * One photo, from the largest source that answers: the bot's original, then the preview link. The
   * first candidate that is already HD_PX wide wins without downloading the other; otherwise the bigger
   * of the two is kept.
   */
  private async copyBest(messageId: number | undefined, preview: string | undefined, base: string, index: number) {
    let best: { bytes: Uint8Array; type: string; px: number } | null = null;
    for (const src of await this.candidates(messageId, preview)) {
      const got = await this.download(src);
      if (got && (!best || got.px > best.px)) best = got;
      if (best && best.px >= HD_PX) break;
    }
    if (!best) return null;
    // The size goes in the name: a bigger copy of the same photo gets a new URL, so the CDN's month-long
    // cache of the old one is never served in its place.
    const name = `${base}${index ? `-${index}` : ""}${best.px ? `-${best.px}px` : ""}`;
    const path = `telegram/${name}.${best.type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error } = await this.supabase.storage.from("media").upload(path, best.bytes, { contentType: best.type, upsert: true });
    return error ? null : { path, px: best.px };
  }

  private async candidates(messageId: number | undefined, preview: string | undefined): Promise<string[]> {
    const list: string[] = [];
    if (messageId !== undefined) {
      const original = await this.originalUrl(messageId);
      if (original) list.push(original);
    }
    if (preview) list.push(preview);
    return list;
  }

  private async originalUrl(messageId: number): Promise<string | null> {
    const m = this.media.get(messageId);
    if (!m || !this.bot) return null;
    const file = await this.bot.call<{ file_path?: string }>("getFile", { file_id: m.file_id });
    return file?.file_path ? this.bot.fileUrl(file.file_path) : null;
  }

  private async download(src: string) {
    try {
      const res = await fetch(src);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const type = sniffImage(bytes);
      if (!type || bytes.byteLength > MAX_IMAGE_BYTES) return null;
      const size = imageSize(bytes);
      // Without readable dimensions the file is still usable; treat it as the small rendition.
      return { bytes, type, px: size ? Math.max(size.width, size.height) : 0 };
    } catch {
      return null;
    }
  }
}

/** What the post became, so the video is titled and filed like it. */
type About = { title: string | null; body?: string | null; category: string | null; newsId: number | null };

/**
 * Puts a post's videos into the site's video section.
 *
 * A small video's file is on the preview page, so it is copied into the bucket and plays on the site. A
 * longer one is not: the page answers "Media is too big" and the Bot API would refuse it too, so the
 * row keeps a link to the post (`kind = 'telegram'`) and the thumbnail we copied, and the site shows a
 * cover with a button that opens Telegram. Nothing is mirrored that we cannot actually hold.
 */
class VideoImporter {
  count = 0;

  constructor(
    private supabase: SupabaseClient,
    private channel: string,
  ) {}

  /** Returns the id of the first video stored, for the post's import record. */
  async importAll(post: TelegramPost, about: About, publish: boolean): Promise<number | null> {
    let first: number | null = null;
    for (const [i, video] of post.videos.entries()) {
      const id = await this.importOne(post, video, i, about, publish);
      if (id && first === null) first = id;
    }
    return first;
  }

  private async importOne(post: TelegramPost, video: TelegramVideo, index: number, about: About, publish: boolean): Promise<number | null> {
    const link = `${this.channel}/${video.id}`;
    const source = `https://t.me/${link}`;
    // The post URL identifies the video whichever way it arrived, so a re-run cannot add it twice.
    const { data: already } = await this.supabase.from("videos").select("id").eq("source_url", source).maybeSingle();
    if (already) return already.id;

    const cover = video.thumb ? await this.copyThumb(video.thumb, `${this.channel.toLowerCase()}-${video.id}`) : null;
    const file = video.url ? await this.copyFile(video.url, video.id) : null;
    const row = {
      title_uz: videoTitle(about.title, post, index, post.videos.length),
      description_uz: about.body?.slice(0, 2000) || null,
      category: videoCategory(about.category),
      kind: file ? "file" : "telegram",
      path: file ?? link,
      cover,
      source_url: source,
      duration_seconds: video.duration,
      // A post made late in the evening UTC already belongs to the next day in Tashkent.
      recorded_on: new Date(Date.parse(post.date) + 5 * 60 * 60 * 1000).toISOString().slice(0, 10),
      news_id: about.newsId,
      is_published: publish,
    };
    const { data, error } = await this.supabase.from("videos").insert(row).select("id").single();
    if (error || !data) return null;
    this.count++;
    return data.id;
  }

  /** The frame Telegram shows before playing, as the video's cover on the site. */
  private async copyThumb(src: string, name: string): Promise<string | null> {
    try {
      const res = await fetch(src);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const type = sniffImage(bytes);
      if (!type || bytes.byteLength > MAX_IMAGE_BYTES) return null;
      const path = `telegram/video-${name}.${type.split("/")[1].replace("jpeg", "jpg")}`;
      const { error } = await this.supabase.storage.from("media").upload(path, bytes, { contentType: type, upsert: true });
      return error ? null : path;
    } catch {
      return null;
    }
  }

  /** Copies the file when it fits in the bucket; null leaves the row as a link to the post. */
  private async copyFile(src: string, messageId: number): Promise<string | null> {
    try {
      // The link carries a short-lived token, so this only works right after the page was read.
      const res = await fetch(src);
      if (!res.ok) return null;
      const declared = Number(res.headers.get("content-length") ?? 0);
      if (declared > MAX_VIDEO_BYTES) {
        await res.body?.cancel();
        return null;
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (!bytes.byteLength || bytes.byteLength > MAX_VIDEO_BYTES) return null;
      const path = `videos/telegram-${this.channel.toLowerCase()}-${messageId}.mp4`;
      const { error } = await this.supabase.storage.from("media").upload(path, bytes, { contentType: "video/mp4", upsert: true });
      return error ? null : path;
    } catch {
      return null;
    }
  }
}

/** The post's own title; an album of several videos numbers them, a wordless post is named by its date. */
function videoTitle(title: string | null, post: TelegramPost, index: number, total: number): string {
  const base = (title || post.text.split("\n")[0] || "").trim().slice(0, 120);
  const named = base || `Video — ${post.date.slice(0, 10).split("-").reverse().join(".")}`;
  return total > 1 ? `${named} (${index + 1})` : named;
}

/** A video is filed under the same kind of heading as the post it came from. */
function videoCategory(newsCategory: string | null): string {
  return newsCategory === "yutuq" ? "yutuq" : "tadbir";
}

/**
 * Videos of posts imported before videos were supported. The posts read this run are used first; for
 * one that has scrolled off the preview pages, its own embed page is read, within a budget.
 */
async function backfillVideos(
  supabase: SupabaseClient,
  channel: string,
  videos: VideoImporter,
  parsed: Map<number, TelegramPost>,
  publish: boolean,
): Promise<void> {
  const { data: pending } = await supabase
    .from("telegram_posts")
    .select("post_id, news_id, skipped, news(title_uz, body_uz, category)")
    .eq("channel", channel)
    .eq("videos_done", false)
    .order("post_id", { ascending: false })
    .limit(VIDEO_BACKFILL_SCAN);
  let budget = VIDEO_BACKFILL_BATCH;
  let embeds = EMBED_BUDGET;

  for (const row of pending ?? []) {
    if (budget <= 0) break;
    // A post the channel marked as not for the site stays off it, video and all.
    if (row.skipped === "#saytga_emas") {
      await markVideosDone(supabase, channel, row.post_id);
      continue;
    }
    let post = parsed.get(row.post_id) ?? null;
    if (!post && embeds > 0) {
      embeds--;
      post = await postFromEmbed(channel, row.post_id);
    }
    if (!post) continue;
    if (!post.videos.length) {
      await markVideosDone(supabase, channel, row.post_id);
      continue;
    }
    budget--;
    const news = row.news as unknown as { title_uz: string; body_uz: string; category: string } | null;
    // Same rule as a fresh import: a video from a post the filter skipped waits for an admin.
    const id = await videos.importAll(
      post,
      { title: news?.title_uz ?? null, body: news?.body_uz ?? null, category: news?.category ?? null, newsId: row.news_id ?? null },
      publish && !row.skipped,
    );
    await markVideosDone(supabase, channel, row.post_id, id);
  }
}

const markVideosDone = (supabase: SupabaseClient, channel: string, postId: number, videoId: number | null = null) =>
  supabase
    .from("telegram_posts")
    .update(videoId ? { videos_done: true, video_id: videoId } : { videos_done: true })
    .eq("channel", channel)
    .eq("post_id", postId);

/**
 * One post read from its own embed page, for a post no longer on the preview pages. The embed page is
 * laid out differently from the channel preview (no message wrappers), so the pieces are read straight
 * out of it. It shows one message, so an album is represented by the member that was asked for.
 */
async function postFromEmbed(channel: string, postId: number): Promise<TelegramPost | null> {
  try {
    const res = await fetch(`https://t.me/${channel}/${postId}?embed=1&mode=tme`, {
      headers: { "User-Agent": "Mozilla/5.0 (school-14 site sync)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const videos = postVideos(html, postId);
    if (!videos.length) return { id: postId, date: new Date().toISOString(), text: "", images: [], photoIds: [], videos: [] };
    const date = /<time[^>]*datetime="([^"]+)"/.exec(html)?.[1] ?? new Date().toISOString();
    const textHtml = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "";
    return { id: postId, date, text: htmlToText(textHtml), images: [], photoIds: [], videos };
  } catch {
    return null;
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

/**
 * Replaces an article's photos when a bigger copy can be had.
 *
 * The only source bigger than the preview grid is the bot's original, which needs the bot to be an
 * admin of the channel (or the post forwarded to it). Until that happens this pass simply re-copies
 * from the preview link, which repairs a post whose stored copies are smaller than the channel's.
 * Three rules keep it safe and bounded: a set is swapped in only when every photo was copied, only
 * when it is strictly bigger than what is stored, and a post is re-fetched at most MAX_PHOTO_TRIES
 * times unless the bot can offer something new.
 */
async function upgradePhotos(
  supabase: SupabaseClient,
  channel: string,
  bot: Bot | null,
  parsed: Map<number, TelegramPost>,
  chatId: number | null,
): Promise<number> {
  const { data: pending } = await supabase
    .from("telegram_posts")
    .select("post_id, news_id, photo_ids, photo_px, photo_tries, news(cover_image)")
    .eq("channel", channel)
    .eq("hd", false)
    .not("news_id", "is", null)
    .order("photo_px", { ascending: true, nullsFirst: true })
    .order("post_id", { ascending: false })
    .limit(UPGRADE_SCAN);
  const media = await loadMedia(supabase, channel);
  const copier = new PhotoCopier(supabase, channel, bot, media);
  const forwarding = !!bot && chatId !== null;
  let forwards = FORWARD_BUDGET;
  // Without admin rights every forward fails, so stop trying after a few failures.
  let failures = 0;
  let embeds = EMBED_BUDGET;
  let upgraded = 0;

  for (const row of pending ?? []) {
    if (upgraded >= UPGRADE_BATCH) break;
    // Already holding what the channel page offers, or asked often enough: only the bot could do better.
    if (!forwarding && ((row.photo_px ?? 0) >= PREVIEW_PX || (row.photo_tries ?? 0) >= MAX_PHOTO_TRIES)) continue;

    // Photo message ids and their preview links, from this run's pages or from the post's own page.
    const fromRun = parsed.get(row.post_id);
    let photos: { id: number; url: string }[] | null = fromRun ? fromRun.photoIds.map((id, i) => ({ id, url: fromRun.images[i] })) : null;
    if (!photos && embeds > 0) {
      embeds--;
      photos = await postPhotosOf(channel, row.post_id);
    }
    if (!photos) continue;
    const ids = photos.map((p) => p.id);
    if (!row.photo_ids) await supabase.from("telegram_posts").update({ photo_ids: ids }).eq("channel", channel).eq("post_id", row.post_id);
    if (!ids.length) {
      // No photos of its own (a video post): nothing to upgrade.
      await supabase.from("telegram_posts").update({ hd: true }).eq("channel", channel).eq("post_id", row.post_id);
      continue;
    }

    if (forwarding) {
      for (const id of ids) {
        if (media.has(id) || forwards <= 0 || failures >= 3) continue;
        forwards--;
        const m = await bot!.fetchOld(id, chatId!);
        if (m) media.set(id, m);
        else failures++;
      }
    }

    await supabase
      .from("telegram_posts")
      .update({ photo_tries: (row.photo_tries ?? 0) + 1 })
      .eq("channel", channel)
      .eq("post_id", row.post_id);

    const { paths, hd, px } = await copier.copyAll(row.post_id, ids, photos.map((p) => p.url));
    // Swap only a complete set, so a failed download never loses a photo, and only when it is strictly
    // bigger -- replacing a copy with a smaller one is the one mistake that cannot be undone.
    if (paths.length !== Math.min(ids.length, MAX_PHOTOS) || px === null) continue;
    if (px <= (row.photo_px ?? 0)) {
      await supabase.from("telegram_posts").update({ hd }).eq("channel", channel).eq("post_id", row.post_id);
      continue;
    }
    const news = row.news as unknown as { cover_image: string | null } | null;
    const oldCover = news?.cover_image ?? null;
    // Keep a cover the admin chose by hand; only Telegram's own cover is replaced.
    if (paths[0] && (!oldCover || oldCover.startsWith("telegram/"))) {
      await supabase.from("news").update({ cover_image: paths[0] }).eq("id", row.news_id);
      if (oldCover && oldCover !== paths[0]) await supabase.storage.from("media").remove([oldCover]);
    }
    await setGallery(supabase, row.news_id, paths.slice(1), true);
    await supabase.from("telegram_posts").update({ hd, photo_px: px }).eq("channel", channel).eq("post_id", row.post_id);
    upgraded++;
  }
  return upgraded;
}

/** A post's photos and their preview links, from its own page (for posts off the preview pages). */
async function postPhotosOf(channel: string, postId: number): Promise<{ id: number; url: string }[] | null> {
  try {
    const res = await fetch(`https://t.me/${channel}/${postId}?embed=1&mode=tme`);
    if (!res.ok) return null;
    return postPhotos(await res.text());
  } catch {
    return null;
  }
}
