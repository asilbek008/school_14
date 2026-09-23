import "server-only";
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
};

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

export async function getNews(limit?: number): Promise<News[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  let query = supabase
    .from("news")
    .select("id, slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, cover_image, published_at, category")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  logError("getNews", error);
  return data ?? [];
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("news")
    .select("id, slug, title_uz, title_ru, title_en, body_uz, body_ru, body_en, cover_image, published_at, category")
    .eq("is_published", true)
    .eq("slug", slug)
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

export async function getStaff(): Promise<Staff[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("staff")
    .select("id, full_name, position_uz, position_ru, position_en, subject_uz, subject_ru, subject_en, photo")
    .eq("is_published", true)
    .order("sort_order")
    .order("full_name");
  logError("getStaff", error);
  return data ?? [];
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

export async function getClubs(): Promise<Club[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("clubs")
    .select(
      "id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, schedule_uz, schedule_ru, schedule_en, place_uz, place_ru, place_en, grade_from, grade_to, leader, photo",
    )
    .eq("is_published", true)
    .order("sort_order")
    .order("id");
  logError("getClubs", error);
  return data ?? [];
}

const albumColumns =
  "id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, event_date, cover_photo, gallery_photos(id, path)";

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
    .order("id", { referencedTable: "gallery_photos" });
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
    .maybeSingle();
  logError("getAlbum", error);
  return data;
}

/** Cover for an album card: the chosen cover, else its first photo. */
export const albumCover = (album: Album) => album.cover_photo ?? album.gallery_photos[0]?.path ?? null;
