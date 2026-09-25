// Place names for the admin logs, from Vercel's geo headers (city, ISO 3166-2 region code, country code).

// Uzbekistan's regions are spelled out; other countries' region codes are left out.
const uzRegions: Record<string, string> = {
  AN: "Andijon", BU: "Buxoro", FA: "Farg‘ona", JI: "Jizzax", NG: "Namangan", NW: "Navoiy", QA: "Qashqadaryo",
  QR: "Qoraqalpog‘iston", SA: "Samarqand", SI: "Sirdaryo", SU: "Surxondaryo", TK: "Toshkent shahri", TO: "Toshkent viloyati", XO: "Xorazm",
};

const countryNames = new Intl.DisplayNames(["uz", "ru", "en"], { type: "region" });

export function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "Qarshi, Qashqadaryo, Oʻzbekiston"; null when nothing is known. */
export function placeName(city: string | null, region: string | null, country: string | null): string | null {
  const regionName = country === "UZ" && region ? (uzRegions[region] ?? null) : null;
  return [city, regionName, countryName(country)].filter((v, i, a) => v && a.indexOf(v) === i).join(", ") || null;
}

/** 🇺🇿 from "UZ"; a pin when the country is unknown. */
export const flagOf = (code: string | null) =>
  code && /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "📍";
