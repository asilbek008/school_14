/** Base URL for objects in the public "media" bucket (safe to use in client components). */
export const mediaBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`;

/** The id of a YouTube video from a watch / share / shorts / embed link, or null. */
export function youtubeId(url: string): string | null {
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url.trim());
  return m ? m[1] : null;
}
