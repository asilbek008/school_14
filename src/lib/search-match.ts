/**
 * Lower case, one apostrophe for o‘/o'/oʻ, ё as е — so "o'qituvchi" finds "O‘qituvchi".
 *
 * Shared, because the page search and the header search have to agree on what counts as the same
 * word; two copies of this would drift the first time one of them learned a new letter.
 */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/ё/g, "е");
