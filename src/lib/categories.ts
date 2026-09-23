// News and event categories (values match the DB check constraints). Labels live in the
// dictionaries (newsCats / eventCats); colors are Tailwind classes for badges and covers.

export const newsCategories = ["yangilik", "elon", "tadbir", "yutuq"] as const;
export type NewsCategory = (typeof newsCategories)[number];

export const eventCategories = ["bayram", "maktab", "olimpiada", "sport"] as const;
export type EventCategory = (typeof eventCategories)[number];

export const newsColors: Record<NewsCategory, { badge: string; cover: string }> = {
  yangilik: { badge: "bg-brand-soft text-brand-deep", cover: "from-[#3e72e8] to-brand-deep" },
  elon: { badge: "bg-gold-soft text-gold-deep", cover: "from-[#e0a33e] to-gold-deep" },
  tadbir: { badge: "bg-[#fae7e2] text-[#c9553f]", cover: "from-[#d2664e] to-[#a63b28]" },
  yutuq: { badge: "bg-teal-soft text-[#0c6d62]", cover: "from-[#17a090] to-[#0c6d62]" },
};

export const eventColors: Record<EventCategory, { badge: string; tile: string }> = {
  bayram: { badge: "bg-gold-soft text-gold-deep", tile: "bg-gold-soft text-gold-deep" },
  maktab: { badge: "bg-brand-soft text-brand-deep", tile: "bg-brand-soft text-brand-deep" },
  olimpiada: { badge: "bg-teal-soft text-[#0c6d62]", tile: "bg-teal-soft text-[#0c6d62]" },
  sport: { badge: "bg-[#fae7e2] text-[#c9553f]", tile: "bg-[#fae7e2] text-[#c9553f]" },
};
