import "server-only";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { createPublicClient } from "@/lib/supabase/public";
import { mediaBaseUrl } from "@/lib/media";
import type { EventCategory, NewsCategory } from "@/lib/categories";

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
  /** Gallery size, for the photo badge on cards (list queries only). */
  news_photos?: { count: number }[];
};

export type NewsArticle = Omit<News, "news_photos"> & { news_photos: { path: string }[] };

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
    .select("id, slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, cover_image, published_at, category, news_photos(count)")
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
    .select("id, slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, cover_image, published_at, category, news_photos(path)")
    .eq("is_published", true)
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "news_photos" })
    .order("id", { referencedTable: "news_photos" })
    .maybeSingle();
  logError("getNewsBySlug", error);
  return data;
}

const eventColumns =
  "id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, location, starts_at, ends_at, category, all_day";

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

export async function getClassTimetable(id: number): Promise<ClassTimetable | null> {
  const supabase = createPublicClient();
  if (!supabase || !Number.isSafeInteger(id)) return null;
  const [{ data, error }, { data: teachers, error: teacherError }] = await Promise.all([
    supabase
      .from("school_classes")
      .select("id, grade, letter, staff(id, full_name), lessons(weekday, period, teacher, alt_teacher, subjects!lessons_subject_id_fkey(name_uz, name_ru, name_en), alt:subjects!lessons_alt_subject_id_fkey(name_uz, name_ru, name_en))")
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

export async function getPrograms(): Promise<Program[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("programs").select(programColumns).eq("is_published", true).order("sort_order").order("id");
  logError("getPrograms", error);
  return data ?? [];
}

export async function getProgram(slug: string): Promise<Program | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("programs").select(programColumns).eq("slug", slug).eq("is_published", true).maybeSingle();
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
const cleanKeyword = (keyword: string) => keyword.replace(/[^\p{L}\p{N} ‘’'-]/gu, "").trim();

/** Published news whose Uzbek title or text mentions the keyword (a program's related news), newest first. */
export async function getNewsMentioning(keyword: string, limit = 12): Promise<News[]> {
  const supabase = createPublicClient();
  const kw = cleanKeyword(keyword);
  if (!supabase || kw.length < 3) return [];
  const { data, error } = await supabase
    .from("news")
    .select("id, slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, cover_image, published_at, category, news_photos(count)")
    .eq("is_published", true)
    .or(`title_uz.ilike."*${kw}*",body_uz.ilike."*${kw}*"`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  logError("getNewsMentioning", error);
  return data ?? [];
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
