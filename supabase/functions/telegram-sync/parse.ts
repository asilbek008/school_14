// Parsing and classification for the Telegram sync. Plain TypeScript without imports, so it runs
// in the Edge Function (Deno) and in Node for tests (scripts/test-telegram-parse.mts).

export type TelegramPost = {
  id: number;
  /** ISO time from Telegram (UTC). */
  date: string;
  text: string;
  /** Preview-size (~800px) photo links; the originals come from the bot (see index.ts). */
  images: string[];
  /** Channel message of each photo (an album is one message per photo), same order as images;
   * empty when the only image is a video's preview frame. */
  photoIds: number[];
  /** Videos of the post (an album may hold several). */
  videos: TelegramVideo[];
};

export type TelegramVideo = {
  /** The channel message the video is, so the post link and the import record are stable. */
  id: number;
  /** Direct file, which the preview page gives only while the video is small; null for a big one
   * ("Media is too big"), which no bot can fetch either -- the Bot API caps getFile at 20 MB. */
  url: string | null;
  /** The frame Telegram shows before playing. */
  thumb: string | null;
  /** Length in seconds, from the "2:05" the page prints. */
  duration: number | null;
};

/** Reads posts from a public channel preview page (https://t.me/s/<channel>), oldest first. */
export function parseChannelPage(html: string): TelegramPost[] {
  const posts: TelegramPost[] = [];
  for (const block of html.split('<div class="tgme_widget_message_wrap').slice(1)) {
    const id = /data-post="[^"/]+\/(\d+)"/.exec(block)?.[1];
    const date = /class="tgme_widget_message_date"[^>]*>\s*<time datetime="([^"]+)"/.exec(block)?.[1];
    if (!id || !date || block.includes("service_message")) continue;
    const textHtml = /<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/.exec(block)?.[1] ?? "";
    const photos = postPhotos(block);
    const images = photos.map((p) => p.url);
    const videos = postVideos(block, Number(id));
    // A post of only videos still needs a cover, and the video's own frame is the honest one.
    if (!photos.length && videos[0]?.thumb) images.push(videos[0].thumb);
    posts.push({
      id: Number(id),
      date,
      text: htmlToText(textHtml),
      images: images.map(absolute),
      photoIds: photos.map((p) => p.id),
      videos,
    });
  }
  return posts;
}

/**
 * A post's photos (albums have several) with the message each one is: the photo link points at it.
 * Not the channel avatar (user_photo) or link preview pictures.
 */
export function postPhotos(html: string): { url: string; id: number }[] {
  // Attribute order differs between single photos and albums, so read each opening tag whole.
  return [...html.matchAll(/<a class="tgme_widget_message_photo_wrap[^>]*>/g)].flatMap(([tag]) => {
    const url = /background-image:url\('([^']+)'\)/.exec(tag)?.[1];
    const id = /href="https:\/\/t\.me\/[^/"]+\/(\d+)/.exec(tag)?.[1];
    return url && id ? [{ url: absolute(url), id: Number(id) }] : [];
  });
}

const absolute = (u: string) => (u.startsWith("//") ? `https:${u}` : u);

/**
 * A post's videos. Each is its own message (an album numbers them like photos), so the link and the
 * import record keep working after the post leaves the preview pages. `postId` is the fallback id for
 * a single video, whose player links to the post itself without a message number of its own.
 */
export function postVideos(html: string, postId: number): TelegramVideo[] {
  // Each player is one anchor; the thumb, the file and the duration sit inside it, before the next one.
  const parts = html.split('<a class="tgme_widget_message_video_player').slice(1);
  return parts.map((part) => {
    const block = part.split('<a class="tgme_widget_message_')[0];
    const href = /^[^>]*href="https:\/\/t\.me\/[^/"]+\/(\d+)/.exec(part)?.[1];
    const thumb = /tgme_widget_message_video_thumb"[^>]*background-image:url\('([^']+)'\)/.exec(block)?.[1];
    // Present only while Telegram serves the file itself; the token in it expires, so copy it promptly.
    const url = /<video[^>]*\bsrc="([^"]+)"/.exec(block)?.[1];
    const time = /js-message_video_duration"[^>]*>([\d:]+)</.exec(block)?.[1];
    return {
      id: href ? Number(href) : postId,
      url: url ? absolute(url) : null,
      thumb: thumb ? absolute(thumb) : null,
      duration: time ? seconds(time) : null,
    };
  });
}

/** "2:05" → 125, "1:02:03" → 3723. */
function seconds(time: string): number | null {
  const parts = time.split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n)) || parts.length < 2 || parts.length > 3) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

/** Number of the oldest post on the page, for fetching the page before it (?before=). */
export function oldestPostId(html: string): number | null {
  const before = /tme_messages_more[^"]*" data-before="(\d+)"/.exec(html)?.[1];
  return before ? Number(before) : null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
      e[0] === "#"
        ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
        : (ENTITIES[e.toLowerCase()] ?? m),
    )
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/**
 * Pixel size from the file's own header, so two renditions of the same photo can be compared without
 * decoding them: JPEG's first frame marker, PNG's IHDR, WebP's VP8/VP8L/VP8X.
 */
export function imageSize(b: Uint8Array): { width: number; height: number } | null {
  const be16 = (i: number) => (b[i] << 8) | b[i + 1];
  const be32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const le16 = (i: number) => b[i] | (b[i + 1] << 8);

  if (b[0] === 0xff && b[1] === 0xd8) {
    // Walk the segment chain to the frame header; SOF0..SOF15 carry the size, DHT/DQT/APPn do not.
    for (let i = 2; i + 9 < b.length; ) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) break; // image data starts; no frame header found
      const length = be16(i + 2);
      if (length < 2) break;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: be16(i + 5), width: be16(i + 7) };
      }
      i += 2 + length;
    }
    return null;
  }
  if (b[0] === 0x89 && b[1] === 0x50 && b.length > 24) return { width: be32(16), height: be32(20) };
  if (b[0] === 0x52 && b[8] === 0x57 && b.length > 30) {
    const fourcc = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (fourcc === "VP8 ") return { width: le16(26) & 0x3fff, height: le16(28) & 0x3fff };
    if (fourcc === "VP8L") {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (fourcc === "VP8X") {
      return { width: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1, height: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1 };
    }
  }
  return null;
}

// ---- Classification --------------------------------------------------------------------------

export type NewsCategory = "yangilik" | "elon" | "tadbir" | "yutuq";
export type EventCategory = "bayram" | "maktab" | "olimpiada" | "sport";

export type Classified =
  | { kind: "skip"; reason: string }
  | { kind: "news"; title: string; body: string; category: NewsCategory }
  | {
      kind: "event";
      title: string;
      description: string;
      category: EventCategory;
      startsAt: string;
      endsAt: string | null;
      allDay: boolean;
      location: string | null;
    };

/** Hashtag (normalized: lowercase, no apostrophes) → event category. */
const EVENT_TAGS: Record<string, EventCategory> = {
  tadbir: "maktab",
  tadbirlar: "maktab",
  bayram: "bayram",
  olimpiada: "olimpiada",
  tanlov: "olimpiada",
  konkurs: "olimpiada",
  sport: "sport",
  musobaqa: "sport",
};
const NEWS_TAGS: Record<string, NewsCategory> = {
  elon: "elon",
  elonlar: "elon",
  yutuq: "yutuq",
  yutuqlar: "yutuq",
  golib: "yutuq",
  yangilik: "yangilik",
  yangiliklar: "yangilik",
};
const SKIP_TAGS = new Set(["saytgaemas", "saytga_emas", "sayt_emas"]);
/** Posts shorter than this (quotes, greetings) are skipped unless tagged #sayt. */
const MIN_TEXT = 80;

const APOSTROPHES = /[‘’'`ʻʼ]/g;
const HASHTAG = /#([\p{L}\p{N}_‘’'`ʻʼ]+)/gu;

export function hashtags(text: string): string[] {
  return [...text.matchAll(HASHTAG)].map((m) => m[1].toLowerCase().replace(APOSTROPHES, ""));
}

/**
 * News by default (short ones are skipped unless tagged #sayt). A post with an event hashtag
 * (#tadbir, #bayram, #olimpiada, #sport…) and a recognizable date becomes an event; without a date
 * it stays news in the "tadbir" category.
 */
export function classify(post: TelegramPost): Classified {
  const tags = hashtags(post.text);
  if (tags.some((t) => SKIP_TAGS.has(t))) return { kind: "skip", reason: "#saytga_emas" };

  const clean = post.text
    .replace(HASHTAG, "")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean) return { kind: "skip", reason: "matn yo‘q" };

  const { title, body } = splitTitle(clean);
  const eventTag = tags.find((t) => t in EVENT_TAGS);
  if (eventTag) {
    const when = findDate(clean, new Date(post.date));
    if (when) {
      return {
        kind: "event",
        title,
        description: body,
        category: EVENT_TAGS[eventTag],
        ...when,
        location: findLocation(clean),
      };
    }
  }
  // Short event announcements are fine; a short news post is usually a quote or a greeting.
  if (clean.length < MIN_TEXT && !tags.includes("sayt")) return { kind: "skip", reason: "juda qisqa" };
  const newsTag = tags.find((t) => t in NEWS_TAGS);
  const category = newsTag ? NEWS_TAGS[newsTag] : eventTag ? "tadbir" : guessCategory(title, clean);
  return { kind: "news", title, body, category };
}

/** Without hashtags: the title's words decide "yutuq" / "elon", a report of an event is "tadbir". */
function guessCategory(title: string, text: string): NewsCategory {
  const t = title.toLowerCase().replace(APOSTROPHES, "");
  if (/yutuq|golib|sovrin|sertifikat|tabrikla|natija|medal|diplom|orin/.test(t)) return "yutuq";
  if (/elon|diqqat/.test(t)) return "elon";
  if (/tadbir|bayram/.test(text.toLowerCase())) return "tadbir";
  return "yangilik";
}

const EDGE_SYMBOLS = /^[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\s*_—–-]+|[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\s*_—–-]+$/gu;

/** Drops decorative emoji around a title and turns an ALL-CAPS title into sentence case. */
export function tidyTitle(title: string): string {
  let t = title.replace(EDGE_SYMBOLS, "").trim() || title.trim();
  const letters = t.match(/\p{L}/gu) ?? [];
  const upper = letters.filter((c) => c !== c.toLowerCase()).length;
  if (letters.length >= 8 && upper / letters.length > 0.8) {
    // Capitalize the first letter, also after an opening quote: “besh tashabbus” → “Besh tashabbus”.
    // A title that starts with a number stays lower case: "1-sinf o‘quvchilari…".
    t = t.toLowerCase().replace(/^([^\p{L}\p{N}]*)(\p{L})/u, (_, lead: string, c: string) => lead + c.toUpperCase());
  }
  return t;
}

/** First line is the title (cut to ~120 chars at a word); the rest is the body. */
export function splitTitle(text: string): { title: string; body: string } {
  const [first, ...rest] = text.split("\n");
  let title = tidyTitle(first.replace(/^[*_\s]+|[*_\s:]+$/g, ""));
  let body = rest.join("\n").trim();
  if (title.length > 120) {
    const cut = title.slice(0, 120);
    title = `${cut.slice(0, cut.lastIndexOf(" ") > 60 ? cut.lastIndexOf(" ") : 120)}…`;
    body = text;
  }
  return { title, body };
}

const MONTHS: [RegExp, number][] = [
  [/^(yanvar|январ)/, 1],
  [/^(fevral|феврал)/, 2],
  [/^(mart|март)/, 3],
  [/^(aprel|апрел)/, 4],
  [/^(may(da|dan|gacha|ni)?|ма[йя])$/, 5],
  [/^(iyun|июн)/, 6],
  [/^(iyul|июл)/, 7],
  [/^(avgust|август)/, 8],
  [/^(sentabr|sentyabr|сентябр)/, 9],
  [/^(oktabr|oktyabr|октябр)/, 10],
  [/^(noyabr|ноябр)/, 11],
  [/^(dekabr|декабр)/, 12],
];

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Tashkent wall time → ISO UTC. */
function tashkent(y: number, m: number, d: number, h: number, min: number): string {
  return new Date(Date.UTC(y, m - 1, d, h, min) - TASHKENT_OFFSET_MS).toISOString();
}

/**
 * "15-oktabr", "15 октября", "15.10.2026", with an optional time ("soat 10:00", "10:00").
 * Without a year: the post's year, or the next one if that date is long past. All-day events are
 * stored as 00:00–23:59 Tashkent time, like the admin form does.
 */
export function findDate(text: string, posted: Date) {
  const lower = text.toLowerCase();
  let day = 0;
  let month = 0;
  let year = 0;

  const named = /(\d{1,2})\s*[-–]?\s*(?:chi\s+)?([a-zа-яё]+)/giu;
  for (const m of lower.matchAll(named)) {
    const found = MONTHS.find(([re]) => re.test(m[2]));
    if (found && Number(m[1]) >= 1 && Number(m[1]) <= 31) {
      day = Number(m[1]);
      month = found[1];
      const yearMatch = /(20\d{2})\s*[-–]?\s*(?:yil|йил|год|г\.)?/.exec(lower.slice(Math.max(0, m.index! - 14), m.index! + m[0].length + 12));
      if (yearMatch) year = Number(yearMatch[1]);
      break;
    }
  }
  if (!day) {
    const numeric = /\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/.exec(lower);
    if (numeric && Number(numeric[2]) >= 1 && Number(numeric[2]) <= 12) {
      day = Number(numeric[1]);
      month = Number(numeric[2]);
      year = Number(numeric[3]);
    }
  }
  if (!day) return null;

  if (!year) {
    const postedLocal = new Date(posted.getTime() + TASHKENT_OFFSET_MS);
    year = postedLocal.getUTCFullYear();
    const candidate = Date.UTC(year, month - 1, day);
    if (candidate < postedLocal.getTime() - 60 * 24 * 60 * 60 * 1000) year += 1;
  }
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1) return null; // 31-noyabr etc.

  const time = /(?:soat|в|at)\s*(\d{1,2})[:.](\d{2})/i.exec(text) ?? /\b(\d{1,2}):(\d{2})\b/.exec(text);
  if (time && Number(time[1]) <= 23 && Number(time[2]) <= 59) {
    return { startsAt: tashkent(year, month, day, Number(time[1]), Number(time[2])), endsAt: null, allDay: false };
  }
  return { startsAt: tashkent(year, month, day, 0, 0), endsAt: tashkent(year, month, day, 23, 59), allDay: true };
}

/** A line like "📍 Maktab sport zali" or "Manzil: …". */
export function findLocation(text: string): string | null {
  const m = /^\s*(?:📍|🏫|manzil\s*:|joy\s*:|место\s*:|адрес\s*:|location\s*:)\s*(.+)$/imu.exec(text);
  return m ? m[1].trim().slice(0, 120) || null : null;
}

/** Same rule as the admin form's slugify(), plus the post number so it is unique. */
export function slugFor(title: string, postId: number): string {
  const base = title
    .toLowerCase()
    .replace(APOSTROPHES, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base ? `${base}-tg${postId}` : `telegram-${postId}`;
}
