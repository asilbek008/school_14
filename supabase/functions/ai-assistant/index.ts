// The site's AI assistant (owner's request): answers a visitor's question about the school from the site's
// own content, in their language. Deployed with verify_jwt off (visitors are anonymous) — the limits are in
// the database (private.ai_guard). The API key never leaves the database: it is read here with the service
// role and used only to call the model.

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://qiziriq14maktab.vercel.app";
const PHONE = "+998 90 970 90 91";
const HOURS = "Dushanba – Shanba, 09:00 – 17:30";
const MAX_QUESTION = 500;

type Config = { key: string | null; model: string; enabled: boolean };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
  });

/** What the school has published, in a shape short enough to send with every question. */
async function context(db: SupabaseClient, lang: string): Promise<string> {
  const L = ["uz", "ru", "en"].includes(lang) ? lang : "uz";
  const pick = (row: Record<string, unknown>, field: string) => String(row[`${field}_${L}`] ?? row[`${field}_uz`] ?? "").trim();
  const now = new Date().toISOString();

  const [pages, news, events, clubs, classes, staff, calendar] = await Promise.all([
    db.from("pages").select("slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en"),
    db.from("news").select("slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, published_at").eq("is_published", true).lte("published_at", now).order("published_at", { ascending: false }).limit(6),
    db.from("events").select("title_uz, title_ru, title_en, starts_at, all_day, location").eq("is_published", true).gte("starts_at", now).order("starts_at").limit(6),
    db.from("clubs").select("name_uz, name_ru, name_en, schedule_uz, place_uz, grade_from, grade_to").eq("is_published", true).limit(20),
    db.from("school_classes").select("grade, letter").eq("is_published", true),
    db.from("staff").select("full_name, position_uz, subject_uz").eq("is_published", true).limit(90),
    db.from("calendar_periods").select("kind, title_uz, title_ru, title_en, starts_on, ends_on").eq("is_published", true).order("starts_on"),
  ]);

  const lines: string[] = [
    `Maktab: Qiziriq tumani 14-maktab. Sayt: ${SITE}. Telefon: ${PHONE}. Ish vaqti: ${HOURS}.`,
    `Baho va davomat faqat eMaktab (emaktab.uz) da; saytda o‘quvchilarning shaxsiy ma’lumoti yo‘q.`,
    `Sinflar soni: ${classes.data?.length ?? 0}. Xodimlar: ${staff.data?.length ?? 0}.`,
    "",
    "## Sahifalar",
    ...(pages.data ?? []).map((p) => `### ${pick(p, "title")} (${SITE}/${L}/${p.slug})\n${pick(p, "body").slice(0, 1500)}`),
    "",
    "## So‘nggi yangiliklar",
    ...(news.data ?? []).map((n) => `- ${pick(n, "title")} (${n.published_at?.slice(0, 10)}): ${pick(n, "body").slice(0, 300)} — ${SITE}/${L}/news/${n.slug}`),
    "",
    "## Yaqin tadbirlar",
    ...(events.data ?? []).map((e) => `- ${pick(e, "title")} — ${e.starts_at?.slice(0, 16).replace("T", " ")}${e.location ? `, ${e.location}` : ""}`),
    "",
    "## To‘garaklar",
    ...(clubs.data ?? []).map((c) => `- ${pick(c, "name")}${c.grade_from ? ` (${c.grade_from}–${c.grade_to}-sinf)` : ""}${c.schedule_uz ? `, ${c.schedule_uz}` : ""}${c.place_uz ? `, ${c.place_uz}` : ""}`),
    "",
    "## O‘quv yili taqvimi",
    ...(calendar.data ?? []).map((c) => `- ${pick(c, "title")}: ${c.starts_on} – ${c.ends_on}`),
    "",
    "## Xodimlar",
    ...(staff.data ?? []).slice(0, 60).map((s) => `- ${s.full_name}${s.position_uz ? `, ${s.position_uz}` : ""}${s.subject_uz ? ` (${s.subject_uz})` : ""}`),
    "",
    "## Saytdagi bo‘limlar",
    `Dars jadvali ${SITE}/${L}/timetable · Qo‘ng‘iroqlar ${SITE}/${L}/schedule · Testlar ${SITE}/${L}/tests · O‘quv yo‘li ${SITE}/${L}/tests/path`,
    `Kutubxona ${SITE}/${L}/library · Yangiliklar ${SITE}/${L}/news · Tadbirlar ${SITE}/${L}/events · Galereya ${SITE}/${L}/gallery`,
    `Qabul ${SITE}/${L}/admissions · Onlayn ariza ${SITE}/${L}/admissions/apply · Aloqa ${SITE}/${L}/contact · Ishonch qutisi ${SITE}/${L}/trust`,
    `Savol-javob ${SITE}/${L}/faq · So‘rovnomalar ${SITE}/${L}/surveys · Ochiqlik ${SITE}/${L}/openness · Shaxsiy kabinet ${SITE}/${L}/cabinet`,
  ];
  return lines.join("\n").slice(0, 24000);
}

const SYSTEM = `Siz — Qiziriq tumani 14-maktab saytining yordamchisisiz. Vazifangiz: ota-onalar va o‘quvchilarning savollariga
faqat quyidagi MA'LUMOT asosida javob berish.

Qoidalar:
- Javobni savol qaysi tilda bo‘lsa, o‘sha tilda yozing (o‘zbekcha — lotin yozuvida).
- Faqat MA'LUMOTdagi faktlarni ayting. Unda yo‘q narsani o‘ylab topmang: bilmasangiz, shuni ochiq ayting va
  maktab telefonini (${PHONE}) yoki aloqa sahifasini ko‘rsating.
- Qisqa yozing: 2–5 jumla. Kerak bo‘lsa, tegishli sahifaning to‘liq havolasini bering.
- Baho, davomat, o‘quvchilarning ismi va shaxsiy ma’lumotlari haqida javob bermang — ular faqat eMaktab'da.
- Pul, to‘lov, qabul shartlari kabi tasdiqlanmagan narsalarni aytmang; maktabga murojaat qilishni so‘rang.
- Siz maktab nomidan rasmiy va’da bermaysiz.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 200);
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: configured } = await db.rpc("ai_config");
  const config = configured as Config | null;
  if (!config?.enabled || !config.key) return json({ error: "off" }, 503);

  const body = (await req.json().catch(() => null)) as { question?: string; lang?: string; visitor?: string } | null;
  const question = (body?.question ?? "").trim().slice(0, MAX_QUESTION);
  if (question.length < 3) return json({ error: "empty" }, 400);
  const lang = ["uz", "ru", "en"].includes(body?.lang ?? "") ? body!.lang! : "uz";

  const { data: allowed } = await db.rpc("ai_guard", { p_visitor: body?.visitor ?? null, p_lang: lang, p_question: question });
  if (!allowed) return json({ error: "too_many" }, 429);

  const anthropic = new Anthropic({ apiKey: config.key });
  try {
    const message = await anthropic.messages.create({
      model: config.model,
      max_tokens: 700,
      // The school's own content is the same on every question, so it is cached and read back at a tenth
      // of the price; only the question itself is new. (Top-level caching keeps the last cacheable block.)
      cache_control: { type: "ephemeral" },
      // Short factual answers from a given text: the cheapest setting is enough. Haiku has no effort knob.
      ...(/haiku/.test(config.model) ? {} : { output_config: { effort: "low" as const } }),
      system: `${SYSTEM}\n\n=== MA'LUMOT ===\n${await context(db, lang)}`,
      messages: [{ role: "user", content: question }],
    });

    // A safety decline comes back as a normal response, not an error.
    if (message.stop_reason === "refusal") return json({ error: "refused" }, 200);

    const answer = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return answer ? json({ answer }) : json({ error: "model" }, 502);
  } catch (e) {
    // Typed SDK errors: a bad key is the school's to fix, a rate limit is ours to wait out.
    if (e instanceof Anthropic.AuthenticationError) {
      console.error("model key rejected");
      return json({ error: "key" }, 502);
    }
    if (e instanceof Anthropic.RateLimitError) return json({ error: "too_many" }, 429);
    console.error("model failed", e instanceof Anthropic.APIError ? `${e.status}` : e instanceof Error ? e.message : e);
    return json({ error: "model" }, 502);
  }
});
