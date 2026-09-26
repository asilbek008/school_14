import "server-only";
import { leagueStages, roundOf, type LeagueTable } from "./league";
import type { SchoolYearRow } from "./school-years";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { createPublicClient } from "@/lib/supabase/public";
import { mediaBaseUrl } from "@/lib/media";
import { school } from "@/lib/school";
import type { EventCategory, NewsCategory } from "@/lib/categories";
import type { PublicQuestion } from "@/lib/tests";

export type News = {
  id: number;
  slug: string;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  body_uz: string;
  body_ru: string | null;
  body_en: string | null;
  cover_image: string | null;
  published_at: string | null;
  category: NewsCategory;
  /** Chosen school year (null = by date). */
  school_year: number | null;
  /** Gallery size, for the photo badge on cards (list queries only). */
  news_photos?: { count: number }[];
};

export type NewsArticle = Omit<News, "news_photos"> & {
  news_photos: { path: string }[];
  news_videos: { id: number; kind: "video" | "youtube"; path: string }[];
};

export type SchoolEvent = {
  id: number;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string;
  description_ru: string | null;
  description_en: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  category: EventCategory;
  all_day: boolean;
  school_year: number | null;
};

export type Staff = {
  id: number;
  full_name: string;
  position_uz: string;
  position_ru: string | null;
  position_en: string | null;
  subject_uz: string | null;
  subject_ru: string | null;
  subject_en: string | null;
  photo: string | null;
};

export type StaffProfile = Staff & {
  category_uz: string | null;
  category_ru: string | null;
  category_en: string | null;
  education_uz: string | null;
  education_ru: string | null;
  education_en: string | null;
  experience_years: number | null;
  phone: string | null;
  email: string | null;
  bio_uz: string | null;
  bio_ru: string | null;
  bio_en: string | null;
  school_classes: { id: number; grade: number; letter: string }[];
};

export type SchoolClass = { id: number; grade: number; letter: string };

export type Subject = { name_uz: string; name_ru: string | null; name_en: string | null };

export type ClassTimetable = SchoolClass & {
  staff: { id: number; full_name: string } | null;
  lessons: {
    weekday: number;
    period: number;
    teacher: string | null;
    subject_id: number | null;
    alt_subject_id: number | null;
    subjects: Subject | null;
    /** Set when the lesson alternates week by week with another subject. */
    alt: Subject | null;
    alt_teacher: string | null;
  }[];
  /** eMaktab teacher name (lowercase) → published staff id, to link lesson teachers to profiles. */
  teacherIds: Record<string, number>;
};

export type Page = {
  slug: string;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  body_uz: string;
  body_ru: string | null;
  body_en: string | null;
};

export type Club = {
  id: number;
  name_uz: string;
  name_ru: string | null;
  name_en: string | null;
  description_uz: string;
  description_ru: string | null;
  description_en: string | null;
  schedule_uz: string | null;
  schedule_ru: string | null;
  schedule_en: string | null;
  place_uz: string | null;
  place_ru: string | null;
  place_en: string | null;
  grade_from: number | null;
  grade_to: number | null;
  leader: string | null;
  photo: string | null;
  days: number[];
  start_time: string | null;
  end_time: string | null;
  /** The leader from the staff list (null if not picked, or their profile is hidden). */
  staff: { id: number; full_name: string } | null;
  club_media: { kind: "photo" | "video" | "youtube" }[];
};

export type ClubMedia = { id: number; kind: "photo" | "video" | "youtube"; path: string };

export type Album = {
  id: number;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string;
  description_ru: string | null;
  description_en: string | null;
  event_date: string | null;
  cover_photo: string | null;
  gallery_photos: { id: number; path: string }[];
  gallery_videos: { id: number; kind: "video" | "youtube"; path: string }[];
};

type Localizable<F extends string> = { [K in `${F}_${Locale}`]: string | null };

/** Returns `row[field_<lang>]`, falling back to the Uzbek value when the translation is empty. */
export function localized<F extends string>(row: Localizable<F>, field: F, lang: Locale): string {
  const value = row[`${field}_${lang}` as `${F}_${Locale}`];
  return value?.trim() ? value : (row[`${field}_uz` as `${F}_${Locale}`] ?? "");
}

/** Resolves a Storage path in the "media" bucket to a public URL; full URLs pass through. */
export function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${mediaBaseUrl}/${path}`;
}

function logError(scope: string, error: { message: string } | null) {
  if (error) console.error(`[content] ${scope}: ${error.message}`);
}

/**
 * The news list (news page, home page, "more news"). News about a regular program — its title or
 * text mentions the program's keyword — is left out: it lives on that program's page, so the same
 * story does not show up in two sections.
 */
export async function getNews(limit?: number): Promise<News[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  let query = supabase
    .from("news")
    .select("id, slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, cover_image, published_at, category, school_year, news_photos(count)")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  for (const kw of await programKeywords()) {
    query = query.not("title_uz", "ilike", `*${kw}*`).not("body_uz", "ilike", `*${kw}*`);
  }
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  logError("getNews", error);
  return data ?? [];
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("news")
    .select("id, slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, cover_image, published_at, category, school_year, news_photos(path), news_videos(id, kind, path)")
    .eq("is_published", true)
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "news_photos" })
    .order("id", { referencedTable: "news_photos" })
    .order("sort_order", { referencedTable: "news_videos" })
    .order("id", { referencedTable: "news_videos" })
    .maybeSingle();
  logError("getNewsBySlug", error);
  return data;
}

const eventColumns =
  "id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, location, starts_at, ends_at, category, all_day, school_year";

/** Upcoming events (soonest first) and past events (most recent first). */
export async function getEvents(): Promise<{ upcoming: SchoolEvent[]; past: SchoolEvent[] }> {
  const supabase = createPublicClient();
  if (!supabase) return { upcoming: [], past: [] };
  const now = new Date().toISOString();
  const [upcoming, past] = await Promise.all([
    // An event stays "upcoming" until it ends (or, without an end time, until it starts).
    supabase
      .from("events")
      .select(eventColumns)
      .eq("is_published", true)
      .or(`ends_at.gte.${now},and(ends_at.is.null,starts_at.gte.${now})`)
      .order("starts_at"),
    supabase
      .from("events")
      .select(eventColumns)
      .eq("is_published", true)
      .or(`ends_at.lt.${now},and(ends_at.is.null,starts_at.lt.${now})`)
      .order("starts_at", { ascending: false })
      .limit(20),
  ]);
  logError("getEvents upcoming", upcoming.error);
  logError("getEvents past", past.error);
  return { upcoming: upcoming.data ?? [], past: past.data ?? [] };
}

const staffColumns = "id, full_name, position_uz, position_ru, position_en, subject_uz, subject_ru, subject_en, photo";

export async function getStaff(): Promise<Staff[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("staff")
    .select(staffColumns)
    .eq("is_published", true)
    .order("sort_order")
    .order("full_name");
  logError("getStaff", error);
  return data ?? [];
}

/** Homeroom class of each teacher who has one: staff id → "5-A" (several joined with ", "). */
export async function getHomerooms(): Promise<Record<number, string>> {
  const supabase = createPublicClient();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("school_classes")
    .select("grade, letter, homeroom_teacher_id")
    .eq("is_published", true)
    .not("homeroom_teacher_id", "is", null)
    .order("grade")
    .order("letter");
  logError("getHomerooms", error);
  const map: Record<number, string> = {};
  for (const c of data ?? []) {
    const id = c.homeroom_teacher_id as number;
    map[id] = map[id] ? `${map[id]}, ${c.grade}-${c.letter}` : `${c.grade}-${c.letter}`;
  }
  return map;
}

export async function getStaffMember(id: number): Promise<StaffProfile | null> {
  const supabase = createPublicClient();
  if (!supabase || !Number.isSafeInteger(id)) return null;
  const { data, error } = await supabase
    .from("staff")
    .select(
      `${staffColumns}, category_uz, category_ru, category_en, education_uz, education_ru, education_en, experience_years, phone, email, bio_uz, bio_ru, bio_en, school_classes(id, grade, letter)`,
    )
    .eq("is_published", true)
    .eq("id", id)
    .order("grade", { referencedTable: "school_classes" })
    .order("letter", { referencedTable: "school_classes" })
    .maybeSingle();
  logError("getStaffMember", error);
  return data;
}

/** All published classes, ordered 1-A, 1-B, … 11-D. */
export async function getClasses(): Promise<SchoolClass[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("school_classes")
    .select("id, grade, letter")
    .eq("is_published", true)
    .order("grade")
    .order("letter");
  logError("getClasses", error);
  return data ?? [];
}

/** Totals for the timetable page: lessons a week across all published classes, and subjects taught. */
export async function getTimetableTotals(): Promise<{ lessons: number; subjects: number }> {
  const supabase = createPublicClient();
  if (!supabase) return { lessons: 0, subjects: 0 };
  const [{ count, error }, { data: used, error: usedError }] = await Promise.all([
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("subjects").select("id, lessons!lessons_subject_id_fkey!inner(id)").limit(1, { referencedTable: "lessons" }),
  ]);
  logError("getTimetableTotals", error ?? usedError);
  return { lessons: count ?? 0, subjects: used?.length ?? 0 };
}

export async function getClassTimetable(id: number): Promise<ClassTimetable | null> {
  const supabase = createPublicClient();
  if (!supabase || !Number.isSafeInteger(id)) return null;
  const [{ data, error }, { data: teachers, error: teacherError }] = await Promise.all([
    supabase
      .from("school_classes")
      .select("id, grade, letter, staff(id, full_name), lessons(weekday, period, teacher, alt_teacher, subject_id, alt_subject_id, subjects!lessons_subject_id_fkey(name_uz, name_ru, name_en), alt:subjects!lessons_alt_subject_id_fkey(name_uz, name_ru, name_en))")
      .eq("is_published", true)
      .eq("id", id)
      .maybeSingle(),
    supabase.from("staff").select("id, short_name").eq("is_published", true).not("short_name", "is", null),
  ]);
  logError("getClassTimetable", error ?? teacherError);
  if (!data) return null;
  const teacherIds = Object.fromEntries((teachers ?? []).map((t) => [t.short_name!.toLowerCase(), t.id]));
  // Without generated DB types supabase-js types to-one embeds (staff, subjects) as arrays.
  return { ...(data as unknown as Omit<ClassTimetable, "teacherIds">), teacherIds };
}

export async function getPage(slug: string): Promise<Page | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en")
    .eq("slug", slug)
    .maybeSingle();
  logError("getPage", error);
  return data;
}

const clubColumns =
  "id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, schedule_uz, schedule_ru, schedule_en, place_uz, place_ru, place_en, grade_from, grade_to, leader, photo, days, start_time, end_time, staff(id, full_name), club_media(kind)";

export async function getClubs(): Promise<Club[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("clubs")
    .select(
      clubColumns,
    )
    .eq("is_published", true)
    .order("sort_order")
    .order("id");
  logError("getClubs", error);
  return (data ?? []) as unknown as Club[];
}

/** One club with its photos and videos in order, or null. */
export async function getClub(id: number): Promise<(Club & { media: ClubMedia[] }) | null> {
  const supabase = createPublicClient();
  if (!supabase || !Number.isSafeInteger(id)) return null;
  const [{ data, error }, { data: media, error: mediaError }] = await Promise.all([
    supabase.from("clubs").select(clubColumns).eq("id", id).eq("is_published", true).maybeSingle(),
    supabase.from("club_media").select("id, kind, path").eq("club_id", id).order("sort_order").order("id"),
  ]);
  logError("getClub", error ?? mediaError);
  return data ? { ...(data as unknown as Club), media: (media ?? []) as ClubMedia[] } : null;
}

export type Program = {
  id: number;
  slug: string;
  name_uz: string;
  name_ru: string | null;
  name_en: string | null;
  summary_uz: string;
  summary_ru: string | null;
  summary_en: string | null;
  description_uz: string;
  description_ru: string | null;
  description_en: string | null;
  schedule_uz: string | null;
  schedule_ru: string | null;
  schedule_en: string | null;
  place_uz: string | null;
  place_ru: string | null;
  place_en: string | null;
  keyword: string | null;
  cover: string | null;
};

const programColumns =
  "id, slug, name_uz, name_ru, name_en, summary_uz, summary_ru, summary_en, description_uz, description_ru, description_en, schedule_uz, schedule_ru, schedule_en, place_uz, place_ru, place_en, keyword, cover";

/** Published programs in order, each with its photo/video count. */
export async function getPrograms(): Promise<(Program & { media: { count: number }[] })[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("programs")
    .select(`${programColumns}, media:program_media(count)`)
    .eq("is_published", true)
    .order("sort_order")
    .order("id");
  logError("getPrograms", error);
  return data ?? [];
}

export type ProgramMedia = ClubMedia & { round: number | null };

export async function getProgram(slug: string): Promise<(Program & { program_media: ProgramMedia[] }) | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("programs")
    .select(`${programColumns}, program_media(id, kind, path, round)`)
    .eq("slug", slug)
    .eq("is_published", true)
    .order("sort_order", { referencedTable: "program_media" })
    .order("id", { referencedTable: "program_media" })
    .maybeSingle();
  logError("getProgram", error);
  return data;
}

/** Keywords of published programs, cleaned for use inside PostgREST filters. */
const programKeywords = cache(async (): Promise<string[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("programs").select("keyword").eq("is_published", true).not("keyword", "is", null);
  logError("programKeywords", error);
  return (data ?? []).map((p) => cleanKeyword(p.keyword ?? "")).filter((kw) => kw.length >= 3);
});

// The keyword goes into a PostgREST filter: keep only characters that cannot break its syntax.
export const cleanKeyword = (keyword: string) => keyword.replace(/[^\p{L}\p{N} ‘’'-]/gu, "").trim();

/** Published news whose Uzbek title or text mentions the keyword (a program's related news), newest first. */
export async function getNewsMentioning(keyword: string, limit = 12): Promise<News[]> {
  const supabase = createPublicClient();
  const kw = cleanKeyword(keyword);
  if (!supabase || kw.length < 3) return [];
  const { data, error } = await supabase
    .from("news")
    .select("id, slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, cover_image, published_at, category, school_year, news_photos(count)")
    .eq("is_published", true)
    .or(`title_uz.ilike."*${kw}*",body_uz.ilike."*${kw}*"`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  logError("getNewsMentioning", error);
  return data ?? [];
}

/**
 * Photos of a program's related news that name a league round ("2-tur…" in the title, else in the text), by round:
 * the cover and the gallery of album posts (a post without a gallery is usually an announcement poster).
 */
export async function getRoundNewsPhotos(keyword: string): Promise<{ round: number; date: string | null; paths: string[] }[]> {
  const supabase = createPublicClient();
  const kw = cleanKeyword(keyword);
  if (!supabase || kw.length < 3) return [];
  const { data, error } = await supabase
    .from("news")
    .select("title_uz, body_uz, cover_image, published_at, news_photos(path, sort_order, id)")
    .eq("is_published", true)
    .or(`title_uz.ilike."*${kw}*",body_uz.ilike."*${kw}*"`)
    .order("published_at", { ascending: true, nullsFirst: false })
    .limit(100);
  logError("getRoundNewsPhotos", error);
  type RoundPhotos = { round: number; date: string | null; paths: string[] };
  const byRound = new Map<number, RoundPhotos>();
  for (const n of data ?? []) {
    const round = roundOf(n.title_uz) ?? roundOf(n.body_uz ?? "");
    if (!round || !n.news_photos.length) continue;
    const gallery = [...n.news_photos].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id).map((p) => p.path);
    const entry: RoundPhotos = byRound.get(round) ?? { round, date: n.published_at, paths: [] };
    for (const path of [n.cover_image, ...gallery]) if (path && !entry.paths.includes(path)) entry.paths.push(path);
    byRound.set(round, entry);
  }
  return [...byRound.values()];
}

const albumColumns =
  "id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, event_date, cover_photo, gallery_photos(id, path), gallery_videos(id, kind, path)";

export async function getAlbums(): Promise<Album[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(albumColumns)
    .eq("is_published", true)
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .order("sort_order", { referencedTable: "gallery_photos" })
    .order("id", { referencedTable: "gallery_photos" })
    .order("sort_order", { referencedTable: "gallery_videos" })
    .order("id", { referencedTable: "gallery_videos" });
  logError("getAlbums", error);
  return data ?? [];
}

export async function getAlbum(id: number): Promise<Album | null> {
  const supabase = createPublicClient();
  if (!supabase || !Number.isSafeInteger(id)) return null;
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(albumColumns)
    .eq("is_published", true)
    .eq("id", id)
    .order("sort_order", { referencedTable: "gallery_photos" })
    .order("id", { referencedTable: "gallery_photos" })
    .order("sort_order", { referencedTable: "gallery_videos" })
    .order("id", { referencedTable: "gallery_videos" })
    .maybeSingle();
  logError("getAlbum", error);
  return data;
}

/** Cover for an album card: the chosen cover, else its first photo. */
export const albumCover = (album: Album) => album.cover_photo ?? album.gallery_photos[0]?.path ?? null;

/** The league tables of a program (republic first), for its page; empty when none were uploaded. */
export async function getLeagueTables(programId: number): Promise<LeagueTable[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("league_tables").select("stage, title, as_of, rows").eq("program_id", programId);
  logError("getLeagueTables", error);
  return ((data ?? []) as LeagueTable[]).sort((a, b) => leagueStages.indexOf(a.stage) - leagueStages.indexOf(b.stage));
}

/** Published school years, newest first (the header's year switcher and the year pages). */
export const getSchoolYears = cache(async (): Promise<SchoolYearRow[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("school_years").select("*").eq("is_published", true).order("start_year", { ascending: false });
  logError("getSchoolYears", error);
  return (data ?? []) as SchoolYearRow[];
});

export type SchoolDocument = {
  id: number;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  category: string;
  kind: "file" | "link";
  path: string | null;
  url: string | null;
  file_type: string | null;
  file_size: number | null;
  doc_date: string | null;
};

/** Published documents (licence, orders, reports, forms) in the order the admin set. */
export async function getDocuments(): Promise<SchoolDocument[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("documents")
    .select("id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, category, kind, path, url, file_type, file_size, doc_date")
    .eq("is_published", true)
    .order("sort_order")
    .order("id");
  logError("getDocuments", error);
  return (data ?? []) as SchoolDocument[];
}

/** Where a document opens: the uploaded file's public URL, or the link the admin gave. */
export const documentHref = (doc: SchoolDocument) => (doc.kind === "link" ? doc.url : mediaUrl(doc.path));

/** "1,4 MB" — a size a parent can judge before tapping on mobile data. */
export function fileSize(bytes: number | null, lang: Locale): string | null {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${new Intl.NumberFormat(lang === "en" ? "en-GB" : lang === "ru" ? "ru-RU" : "uz-UZ", { maximumFractionDigits: 1 }).format(mb)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export type CalendarPeriod = {
  id: number;
  kind: "chorak" | "tatil" | "imtihon" | "boshqa";
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  note_uz: string | null;
  note_ru: string | null;
  note_en: string | null;
  starts_on: string;
  ends_on: string;
};

/**
 * One school year's calendar: the admin's periods (quarters, holidays, exams) that touch it, and the
 * public holidays from events (category 'bayram') dated in it.
 */
export async function getCalendar(start: number): Promise<{ periods: CalendarPeriod[]; holidays: SchoolEvent[] }> {
  const supabase = createPublicClient();
  if (!supabase) return { periods: [], holidays: [] };
  const first = `${start}-09-01`;
  const last = `${start + 1}-08-31`;
  const [periods, holidays] = await Promise.all([
    supabase
      .from("calendar_periods")
      .select("id, kind, title_uz, title_ru, title_en, note_uz, note_ru, note_en, starts_on, ends_on")
      .eq("is_published", true)
      .lte("starts_on", last)
      .gte("ends_on", first)
      .order("starts_on"),
    supabase
      .from("events")
      .select(eventColumns)
      .eq("is_published", true)
      .eq("category", "bayram")
      .gte("starts_at", `${first}T00:00:00+05:00`)
      .lt("starts_at", `${start + 1}-09-01T00:00:00+05:00`)
      .order("starts_at"),
  ]);
  logError("getCalendar periods", periods.error);
  logError("getCalendar holidays", holidays.error);
  return { periods: (periods.data ?? []) as CalendarPeriod[], holidays: holidays.data ?? [] };
}

export type Achievement = {
  id: number;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  field: string;
  level: string;
  place: number | null;
  result_uz: string | null;
  result_ru: string | null;
  result_en: string | null;
  winner: string | null;
  names: string | null;
  names_consent: boolean;
  achieved_on: string;
  school_year: number | null;
  photo: string | null;
  staff: { id: number; full_name: string } | null;
};

/** Published results, newest first; pupils' names only where consent was given (the DB also enforces it). */
export async function getAchievements(): Promise<Achievement[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("achievements")
    .select(
      "id, title_uz, title_ru, title_en, field, level, place, result_uz, result_ru, result_en, winner, names, names_consent, achieved_on, school_year, photo, staff(id, full_name)",
    )
    .eq("is_published", true)
    .order("achieved_on", { ascending: false })
    .order("id", { ascending: false });
  logError("getAchievements", error);
  return ((data ?? []) as unknown as Achievement[]).map((a) => (a.names_consent ? a : { ...a, names: null }));
}

export type TestSummary = {
  id: number;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  subject: string;
  kind: "mavzu" | "dtm";
  grade: number | null;
  time_limit: number | null;
  source: string | null;
  questions: number;
};

/** Published tests in the admin's order, with their question counts. */
export const getTests = cache(async (): Promise<TestSummary[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  // Visitors may not read every column of test_questions, so the count embed is not allowed: count the ids.
  const { data, error } = await supabase
    .from("tests")
    .select("id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, subject, kind, grade, time_limit, source, test_questions(id)")
    .eq("is_published", true)
    .order("sort_order")
    .order("id");
  logError("getTests", error);
  return (data ?? [])
    .map(({ test_questions, ...t }) => ({ ...t, questions: (test_questions as { id: number }[]).length }) as TestSummary)
    .filter((t) => t.questions > 0);
});

/** One published test and its questions (without answers). */
export async function getTest(id: number): Promise<(TestSummary & { items: PublicQuestion[] }) | null> {
  const supabase = createPublicClient();
  if (!supabase || !Number.isSafeInteger(id)) return null;
  const { data, error } = await supabase
    .from("tests")
    .select(
      "id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, subject, kind, grade, time_limit, source, test_questions(id, question, options, image, sort_order)",
    )
    .eq("id", id)
    .eq("is_published", true)
    .order("sort_order", { referencedTable: "test_questions" })
    .order("id", { referencedTable: "test_questions" })
    .maybeSingle();
  logError("getTest", error);
  if (!data) return null;
  const { test_questions, ...t } = data;
  const items = (test_questions as (PublicQuestion & { sort_order: number })[]).map(({ id, question, options, image }) => ({ id, question, options, image }));
  return { ...(t as Omit<TestSummary, "questions">), questions: items.length, items };
}

/**
 * Pupils in the school: the sum of the admin's per-class numbers once every published class has one,
 * otherwise the confirmed total in school.ts.
 */
export const getStudentTotal = cache(async (): Promise<number> => {
  const supabase = createPublicClient();
  if (!supabase) return school.stats.students;
  const { data, error } = await supabase.from("school_classes").select("students").eq("is_published", true);
  logError("getStudentTotal", error);
  const rows = data ?? [];
  if (!rows.length || rows.some((r) => r.students == null)) return school.stats.students;
  return rows.reduce((a, r) => a + (r.students ?? 0), 0);
});

export type Textbook = {
  id: number;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  grade: number | null;
  language: "uz" | "ru" | "en";
  author: string | null;
  edition: string | null;
  source: string | null;
  kind: "file" | "link";
  path: string | null;
  url: string | null;
  file_size: number | null;
  pages: number | null;
  cover: string | null;
  subjects: { id: number; name_uz: string; name_ru: string | null; name_en: string | null } | null;
};

const textbookColumns =
  "id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, grade, language, author, edition, source, kind, path, url, file_size, pages, cover, subjects(id, name_uz, name_ru, name_en)";

/** The e-library: published books by grade (general ones last), then the admin's order. */
export const getTextbooks = cache(async (): Promise<Textbook[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("textbooks")
    .select(textbookColumns)
    .eq("is_published", true)
    .order("grade", { nullsFirst: false })
    .order("sort_order")
    .order("id");
  logError("getTextbooks", error);
  return (data ?? []) as unknown as Textbook[];
});

export async function getTextbook(id: number): Promise<Textbook | null> {
  const supabase = createPublicClient();
  if (!supabase || !Number.isSafeInteger(id)) return null;
  const { data, error } = await supabase.from("textbooks").select(textbookColumns).eq("id", id).eq("is_published", true).maybeSingle();
  logError("getTextbook", error);
  return data as unknown as Textbook | null;
}

/** Where a book's PDF is: the media bucket file, or the admin's link. */
export function textbookHref(b: Pick<Textbook, "kind" | "path" | "url">): string | null {
  return b.kind === "file" ? mediaUrl(b.path) : b.url;
}
