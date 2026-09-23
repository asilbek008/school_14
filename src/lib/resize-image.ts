import type { SupabaseClient } from "@supabase/supabase-js";

// Browser-only: shrinks photos before upload. Phone photos are often 3–10 MB and larger than
// the "media" bucket's 5 MB limit, and HEIC (iPhone) isn't an allowed type — re-encoding to JPEG
// fixes both (where the browser can decode the file).

const MAX_SIDE = 1920;
const QUALITY = 0.85;
const KEEP_AS_IS_BYTES = 800 * 1024;

export async function resizeImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  const passThrough = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  // createImageBitmap applies EXIF orientation, so rotated phone photos come out upright.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

  if (passThrough && scale === 1 && file.size <= KEEP_AS_IS_BYTES) {
    bitmap.close();
    return { blob: file, ext: file.type.split("/")[1].replace("jpeg", "jpg"), type: file.type };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // PNG transparency → white instead of black in JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", QUALITY),
  );
  return { blob, ext: "jpg", type: "image/jpeg" };
}

/** Uploads one image to the "media" bucket under `folder`; returns the object path. */
export async function uploadImage(supabase: SupabaseClient, folder: string, file: File): Promise<string> {
  const { blob, ext, type } = await resizeImage(file);
  if (blob.size > 5 * 1024 * 1024) throw new Error("Rasm 5 MB dan katta.");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: type, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return path;
}
