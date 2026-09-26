// The parents' bot: answers commands (lessons of a class for today/tomorrow, news, events, subscription) and sends
// new news to subscribed chats. No imports but the bell schedule, so it also runs under Node for the test
// (scripts/test-parent-bot.mts); the Deno wiring is in index.ts.

import { fmtMinutes, lessons as bellTimes, shiftForGrade } from "./bells.ts";

export const SITE = "https://qiziriq14maktab.vercel.app";
export const MEDIA = "https://cieusvxrfpshlpjelvkt.supabase.co/storage/v1/object/public/media";
/** The school's phone (the same as `school.phone` in src/lib/school.ts). */
const PHONE = "+998 90 970 90 91";

type TgResponse = { ok: boolean; result?: unknown; error_code?: number; description?: string; parameters?: { retry_after?: number } };
export type Tg = (method: string, params: Record<string, unknown>) => Promise<TgResponse>;

// The part of the Supabase client this file uses (kept loose so the file needs no import).
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = { from: (table: string) => any };

type Chat = { id: number; type: string };
type Message = { message_id: number; chat: Chat; text?: string };
export type Update = {
  update_id: number;
  message?: Message;
  callback_query?: { id: string; data?: string; message?: Message };
};

const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

const buttons = {
  today: "📅 Bugungi darslar",
  tomorrow: "📆 Ertangi darslar",
  news: "📰 Yangiliklar",
  events: "🎉 Tadbirlar",
  pick: "🏫 Sinfni tanlash",
  sub: "🔔 Obuna",
  contact: "📞 Aloqa",
};

// The command menu is set by the admin panel (src/app/admin/(panel)/parent-bot/actions.ts).
const keyboard = {
  keyboard: [
    [{ text: buttons.today }, { text: buttons.tomorrow }],
    [{ text: buttons.news }, { text: buttons.events }],
    [{ text: buttons.pick }, { text: buttons.sub }],
    [{ text: buttons.contact }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

// Cyrillic letters parents may type for Latin class letters.
const cyr: Record<string, string> = { А: "A", В: "B", Б: "B", Д: "D", Е: "E", Э: "E", Ф: "F", С: "S", Г: "G", К: "K", М: "M", Н: "N" };

/** "8-A", "8a", "8 А", "/darslar 11-b" → { grade, letter }. */
export function parseClass(text: string): { grade: number; letter: string } | null {
  const m = text.match(/(?:^|[^\d])(\d{1,2})\s*[-–—]?\s*["'‘’ʻ]?([A-Za-zА-Яа-яЁё])(?![A-Za-zА-Яа-яЁё])/);
  if (!m) return null;
  const grade = Number(m[1]);
  if (grade < 1 || grade > 11) return null;
  const upper = m[2].toUpperCase();
  return { grade, letter: cyr[upper] ?? upper };
}

/** The Tashkent calendar day `offset` days from `now`: its ISO date and weekday (0 = Sunday). */
export function tashkentDay(now: Date, offset = 0) {
  const d = new Date(now.getTime() + 5 * 3_600_000 + offset * 86_400_000);
  return { date: d.toISOString().slice(0, 10), weekday: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

export const dayLabel = (day: { date: string; weekday: number }) => {
  const [, m, d] = day.date.split("-").map(Number);
  return `${days[day.weekday]}, ${d}-${months[m - 1]}`;
};

type ClassRow = { id: number; grade: number; letter: string };

async function findClass(db: Db, grade: number, letter: string): Promise<ClassRow | null> {
  const { data } = await db
    .from("school_classes")
    .select("id, grade, letter")
    .eq("grade", grade)
    .eq("letter", letter)
    .eq("is_published", true)
    .maybeSingle();
  return data ?? null;
}

async function chatClass(db: Db, chatId: number): Promise<ClassRow | null> {
  const { data } = await db.from("parent_bot_chats").select("school_classes(id, grade, letter, is_published)").eq("chat_id", chatId).maybeSingle();
  const c = data?.school_classes;
  return c?.is_published ? { id: c.id, grade: c.grade, letter: c.letter } : null;
}

/** The lessons of a class on one day, as a message (or why there are none). */
export async function lessonsText(db: Db, cls: ClassRow, day: { date: string; weekday: number }, lead = ""): Promise<string> {
  const title = `📅 <b>${cls.grade}-${esc(cls.letter)} sinf</b> · ${dayLabel(day)}`;
  const link = `\n\n<a href="${SITE}/uz/timetable/${cls.id}">To‘liq haftalik jadval →</a>`;
  if (day.weekday === 0) return `${lead}${title}\n\nYakshanba — dam olish kuni.${link}`;

  const { data: holiday } = await db
    .from("calendar_periods")
    .select("title_uz")
    .eq("kind", "tatil")
    .eq("is_published", true)
    .lte("starts_on", day.date)
    .gte("ends_on", day.date)
    .limit(1);
  if (holiday?.length) return `${lead}${title}\n\n🏖 ${esc(holiday[0].title_uz)} — darslar yo‘q.${link}`;

  const { data } = await db
    .from("lessons")
    .select("period, teacher, alt_teacher, subject:subjects!lessons_subject_id_fkey(name_uz), alt:subjects!lessons_alt_subject_id_fkey(name_uz)")
    .eq("class_id", cls.id)
    .eq("weekday", day.weekday)
    .order("period");
  type Row = { period: number; teacher: string | null; alt_teacher: string | null; subject: { name_uz: string } | null; alt: { name_uz: string } | null };
  const rows = (data ?? []) as Row[];
  if (!rows.length) return `${lead}${title}\n\nBu kun uchun dars jadvali kiritilmagan.${link}`;

  const shift = shiftForGrade(cls.grade);
  const times = bellTimes(shift);
  const lines = rows.map((r) => {
    const t = times[r.period - 1];
    const time = t ? `${fmtMinutes(t.start)}–${fmtMinutes(t.end)}` : "";
    const subject = r.alt ? `${r.subject?.name_uz ?? "—"} / ${r.alt.name_uz}` : (r.subject?.name_uz ?? "—");
    const teachers = [r.teacher, r.alt ? r.alt_teacher : null].filter(Boolean).join(" / ");
    return `<b>${r.period}.</b> ${time} — ${esc(subject)}${teachers ? `\n      <i>${esc(teachers)}</i>` : ""}`;
  });
  const note = rows.some((r) => r.alt) ? "\n\n«/» — haftama-hafta almashadigan dars." : "";
  return `${lead}${title}\n${shift.id}-smena · ${shift.start} dan\n\n${lines.join("\n")}${note}${link}`;
}

async function newsText(db: Db, now: Date): Promise<string> {
  const { data } = await db
    .from("news")
    .select("slug, title_uz, published_at")
    .eq("is_published", true)
    .lte("published_at", now.toISOString())
    .order("published_at", { ascending: false })
    .limit(5);
  const rows = (data ?? []) as { slug: string; title_uz: string; published_at: string }[];
  if (!rows.length) return "Hozircha yangiliklar yo‘q.";
  const list = rows.map((n) => `• <a href="${SITE}/uz/news/${encodeURIComponent(n.slug)}">${esc(n.title_uz)}</a> <i>(${dayLabel(tashkentDay(new Date(n.published_at)))})</i>`);
  return `📰 <b>So‘nggi yangiliklar</b>\n\n${list.join("\n\n")}\n\n<a href="${SITE}/uz/news">Barcha yangiliklar →</a>`;
}

async function eventsText(db: Db, now: Date): Promise<string> {
  const today = tashkentDay(now);
  const { data } = await db
    .from("events")
    .select("title_uz, starts_at, all_day, location")
    .eq("is_published", true)
    .gte("starts_at", `${today.date}T00:00:00+05:00`)
    .order("starts_at")
    .limit(5);
  const rows = (data ?? []) as { title_uz: string; starts_at: string; all_day: boolean; location: string | null }[];
  if (!rows.length) return "Yaqin kunlarda tadbir rejalashtirilmagan.";
  const list = rows.map((e) => {
    const d = tashkentDay(new Date(e.starts_at));
    const time = e.all_day ? "" : ` · ${fmtMinutes(d.minutes)}`;
    return `• <b>${esc(e.title_uz)}</b>\n   ${dayLabel(d)}${time}${e.location ? ` · ${esc(e.location)}` : ""}`;
  });
  return `🎉 <b>Yaqin tadbirlar</b>\n\n${list.join("\n\n")}\n\n<a href="${SITE}/uz/events">Barcha tadbirlar →</a>`;
}

const welcome = (cls: ClassRow | null) =>
  [
    "Assalomu alaykum! Bu — <b>Qiziriq tumani 14-maktabi</b>ning ota-onalar uchun boti.",
    "",
    "• Farzandingiz sinfining bugungi va ertangi darslari",
    "• Maktab yangiliklari va tadbirlari",
    "• Yangi e’lon chiqqanda shu yerga xabar keladi (🔔 Obuna)",
    "",
    cls
      ? `Tanlangan sinf: <b>${cls.grade}-${esc(cls.letter)}</b>. Boshqasini tanlash — «${buttons.pick}».`
      : `Avval sinfni tanlang: «${buttons.pick}» tugmasini bosing yoki sinfni yozing (masalan: <b>8-A</b>).`,
    "",
    "Bot hech qanday shaxsiy ma’lumot so‘ramaydi; baho va davomat — faqat eMaktab’da.",
  ].join("\n");

const subText = (on: boolean) =>
  on
    ? "🔔 Obuna yoqilgan: maktabda yangi yangilik yoki e’lon chiqqanda shu yerga yuboriladi."
    : "🔕 Obuna o‘chiq: yangiliklar yuborilmaydi.";
const subButton = (on: boolean) => ({
  inline_keyboard: [[on ? { text: "🔕 O‘chirish", callback_data: "s:0" } : { text: "🔔 Yoqish", callback_data: "s:1" }]],
});

async function gradePicker(tg: Tg, chatId: number, editId?: number) {
  const rows = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]].map((row) => row.map((g) => ({ text: `${g}-sinf`, callback_data: `g:${g}` })));
  const params = { chat_id: chatId, text: "Farzandingiz nechanchi sinfda o‘qiydi?", reply_markup: { inline_keyboard: rows } };
  await (editId ? tg("editMessageText", { ...params, message_id: editId }) : tg("sendMessage", params));
}

async function letterPicker(db: Db, tg: Tg, chatId: number, grade: number, editId: number) {
  const { data } = await db.from("school_classes").select("id, letter").eq("grade", grade).eq("is_published", true).order("letter");
  const list = (data ?? []) as { id: number; letter: string }[];
  const row = list.map((c) => ({ text: `${grade}-${c.letter}`, callback_data: `c:${c.id}` }));
  const rows = [];
  for (let i = 0; i < row.length; i += 4) rows.push(row.slice(i, i + 4));
  rows.push([{ text: "← Orqaga", callback_data: "g:0" }]);
  await tg("editMessageText", {
    chat_id: chatId,
    message_id: editId,
    text: list.length ? `${grade}-sinf: qaysi sinf?` : `${grade}-sinflar ro‘yxati hali kiritilmagan.`,
    reply_markup: { inline_keyboard: rows },
  });
}

async function send(tg: Tg, chatId: number, text: string, extra: Record<string, unknown> = {}) {
  await tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true }, ...extra });
}

/** The lessons for "today" (Sunday → Monday) or "tomorrow" (Sunday → Monday). */
export function pickDay(now: Date, which: "today" | "tomorrow") {
  const today = tashkentDay(now);
  if (which === "today") return today.weekday === 0 ? { day: tashkentDay(now, 1), lead: "Bugun yakshanba — dushanba darslari:\n\n" } : { day: today, lead: "" };
  const tomorrow = tashkentDay(now, 1);
  return tomorrow.weekday === 0 ? { day: tashkentDay(now, 2), lead: "Ertaga yakshanba — dushanba darslari:\n\n" } : { day: tomorrow, lead: "" };
}

async function showLessons(db: Db, tg: Tg, chatId: number, cls: ClassRow | null, which: "today" | "tomorrow", now: Date) {
  if (!cls) {
    await send(tg, chatId, "Qaysi sinf? Sinfni yozing (masalan: <b>8-A</b>) yoki tanlang:");
    return gradePicker(tg, chatId);
  }
  const { day, lead } = pickDay(now, which);
  let text = await lessonsText(db, cls, day, lead);
  // After the shift has ended, point to tomorrow.
  const t = tashkentDay(now);
  const last = bellTimes(shiftForGrade(cls.grade)).at(-1)!;
  if (which === "today" && day.date === t.date && t.minutes >= last.end) text += "\n\nBugungi darslar tugadi. Ertangi darslar — /ertaga";
  await send(tg, chatId, text);
}

/** Handles one update from Telegram (message or button press). */
export async function handleUpdate(update: Update, db: Db, tg: Tg, now = new Date()) {
  const cb = update.callback_query;
  if (cb?.message && cb.data) {
    const chatId = cb.message.chat.id;
    await tg("answerCallbackQuery", { callback_query_id: cb.id });
    const [kind, value] = cb.data.split(":");
    if (kind === "g") {
      const grade = Number(value);
      return grade ? letterPicker(db, tg, chatId, grade, cb.message.message_id) : gradePicker(tg, chatId, cb.message.message_id);
    }
    if (kind === "c") {
      const { data } = await db.from("school_classes").select("id, grade, letter").eq("id", Number(value)).eq("is_published", true).maybeSingle();
      if (!data) return;
      await remember(db, cb.message.chat, { class_id: data.id });
      await tg("editMessageText", { chat_id: chatId, message_id: cb.message.message_id, text: `✅ Sinf tanlandi: ${data.grade}-${data.letter}` });
      return showLessons(db, tg, chatId, data, "today", now);
    }
    if (kind === "s") {
      const on = value === "1";
      await db.from("parent_bot_chats").update({ subscribed: on }).eq("chat_id", chatId);
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: cb.message.message_id,
        text: subText(on),
        reply_markup: subButton(on),
      });
    }
    return;
  }

  const msg = update.message;
  if (!msg?.text) return;
  const chatId = msg.chat.id;
  const isPrivate = msg.chat.type === "private";
  const raw = msg.text.trim();
  // In groups the bot answers only commands.
  if (!isPrivate && !raw.startsWith("/")) return;
  const [head, ...rest] = raw.split(/\s+/);
  const command = head.startsWith("/") ? head.slice(1).split("@")[0].toLowerCase() : "";
  const arg = rest.join(" ");
  const extra = isPrivate ? { reply_markup: keyboard } : {};

  await remember(db, msg.chat, {});
  const saved = await chatClass(db, chatId);

  if (command === "start" || command === "help" || command === "yordam") {
    await send(tg, chatId, welcome(saved), extra);
    if (!saved && isPrivate) await gradePicker(tg, chatId);
    return;
  }
  if (command === "darslar" || command === "ertaga" || raw === buttons.today || raw === buttons.tomorrow) {
    const which = command === "ertaga" || raw === buttons.tomorrow ? "tomorrow" : "today";
    const asked = parseClass(arg);
    let cls = saved;
    if (asked) {
      cls = await findClass(db, asked.grade, asked.letter);
      if (!cls) return send(tg, chatId, `${asked.grade}-${esc(asked.letter)} sinfi topilmadi. Sinfni tanlang:`).then(() => gradePicker(tg, chatId));
      if (!saved) await remember(db, msg.chat, { class_id: cls.id });
    }
    return showLessons(db, tg, chatId, cls, which, now);
  }
  if (command === "sinf" || raw === buttons.pick) {
    const asked = parseClass(arg);
    if (asked) {
      const cls = await findClass(db, asked.grade, asked.letter);
      if (cls) {
        await remember(db, msg.chat, { class_id: cls.id });
        await send(tg, chatId, `✅ Sinf tanlandi: <b>${cls.grade}-${esc(cls.letter)}</b>`, extra);
        return showLessons(db, tg, chatId, cls, "today", now);
      }
    }
    return gradePicker(tg, chatId);
  }
  if (command === "yangiliklar" || raw === buttons.news) return send(tg, chatId, await newsText(db, now), extra);
  if (command === "tadbirlar" || raw === buttons.events) return send(tg, chatId, await eventsText(db, now), extra);
  if (command === "obuna" || raw === buttons.sub) {
    const { data } = await db.from("parent_bot_chats").select("subscribed").eq("chat_id", chatId).maybeSingle();
    return send(tg, chatId, subText(!!data?.subscribed), { reply_markup: subButton(!!data?.subscribed) });
  }
  if (command === "aloqa" || raw === buttons.contact) {
    return send(
      tg,
      chatId,
      `📞 <b>Maktab bilan bog‘lanish</b>\n\nTelefon: ${PHONE}\nIsh vaqti: Dushanba – Shanba, 09:00 – 17:30\n\n<a href="${SITE}/uz/contact">Murojaat yuborish (sayt) →</a>\n<a href="${SITE}/uz/trust">Ishonch qutisi (ismsiz) →</a>`,
      extra,
    );
  }
  // A class typed on its own ("8-A") — that class's lessons today.
  const asked = parseClass(raw);
  if (asked && !command) {
    const cls = await findClass(db, asked.grade, asked.letter);
    if (cls) {
      if (!saved) await remember(db, msg.chat, { class_id: cls.id });
      return showLessons(db, tg, chatId, cls, "today", now);
    }
    return send(tg, chatId, `${asked.grade}-${esc(asked.letter)} sinfi topilmadi. Sinfni tanlang:`).then(() => gradePicker(tg, chatId));
  }
  return send(tg, chatId, `Tushunmadim. Pastdagi tugmalardan foydalaning yoki sinfni yozing (masalan: <b>8-A</b>).`, extra);
}

/** Saves the chat (first contact: private chats are subscribed to news, groups are not) and the given fields. */
async function remember(db: Db, chat: Chat, fields: { class_id?: number }) {
  await db
    .from("parent_bot_chats")
    .upsert({ chat_id: chat.id, subscribed: chat.type === "private" }, { onConflict: "chat_id", ignoreDuplicates: true });
  await db
    .from("parent_bot_chats")
    .update({ ...fields, last_seen_at: new Date().toISOString() })
    .eq("chat_id", chat.id);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Sends newly published news (claimed so that it goes out once) to every subscribed chat, ~25 messages a second. */
export async function broadcast(db: Db, tg: Tg, now = new Date()) {
  const { data: news } = await db
    .from("news")
    .update({ bot_sent_at: now.toISOString() })
    .is("bot_sent_at", null)
    .eq("is_published", true)
    .lte("published_at", now.toISOString())
    .gt("published_at", new Date(now.getTime() - 3 * 86_400_000).toISOString())
    .select("id, slug, title_uz, body_uz, cover_image");
  const items = (news ?? []) as { id: number; slug: string; title_uz: string; body_uz: string; cover_image: string | null }[];
  if (!items.length) return { news: 0, sent: 0, removed: 0 };

  const chats: number[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("parent_bot_chats").select("chat_id").eq("subscribed", true).order("chat_id").range(from, from + 999);
    const page = (data ?? []) as { chat_id: number }[];
    chats.push(...page.map((c) => c.chat_id));
    if (page.length < 1000) break;
  }

  let sent = 0;
  const gone = new Set<number>();
  for (const n of items) {
    const body = clip(n.body_uz.replace(/\s+/g, " ").trim(), 600);
    const caption = `📰 <b>${esc(n.title_uz)}</b>\n\n${esc(body)}\n\n<a href="${SITE}/uz/news/${encodeURIComponent(n.slug)}">Batafsil →</a>`;
    const photo = n.cover_image ? (/^https?:\/\//.test(n.cover_image) ? n.cover_image : `${MEDIA}/${n.cover_image}`) : null;
    for (const chatId of chats) {
      if (gone.has(chatId)) continue;
      for (let attempt = 0; attempt < 2; attempt++) {
        let res = photo
          ? await tg("sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "HTML" })
          : await tg("sendMessage", { chat_id: chatId, text: caption, parse_mode: "HTML", link_preview_options: { is_disabled: true } });
        // A photo Telegram cannot fetch: the text alone.
        if (!res.ok && photo && res.error_code === 400 && !/chat not found/i.test(res.description ?? "")) {
          res = await tg("sendMessage", { chat_id: chatId, text: caption, parse_mode: "HTML", link_preview_options: { is_disabled: true } });
        }
        if (res.ok) {
          sent++;
        } else if (res.error_code === 429 && attempt === 0) {
          await sleep((res.parameters?.retry_after ?? 1) * 1000);
          continue;
        } else if (res.error_code === 403 || /chat not found/i.test(res.description ?? "")) {
          gone.add(chatId);
        }
        break;
      }
      await sleep(40);
    }
  }
  if (gone.size) await db.from("parent_bot_chats").delete().in("chat_id", [...gone]);
  return { news: items.length, sent, removed: gone.size };
}
