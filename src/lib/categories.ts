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

// What a contact-form message is about (matches the contact_messages.topic check).
export const contactTopics = ["savol", "taklif", "murojaat", "boshqa"] as const;
export type ContactTopic = (typeof contactTopics)[number];

// What a trust-box message is about (matches the trust_messages.topic check).
export const trustTopics = ["xavfsizlik", "pul", "munosabat", "taklif", "boshqa"] as const;
export type TrustTopic = (typeof trustTopics)[number];

// What an open document is (matches the documents.category check). Labels live in the dictionaries (docCats).
export const documentCategories = ["meyoriy", "buyruq", "hisobot", "shakl", "boshqa"] as const;
export type DocumentCategory = (typeof documentCategories)[number];

export const documentColors: Record<DocumentCategory, string> = {
  meyoriy: "bg-brand-soft text-brand-deep",
  buyruq: "bg-gold-soft text-gold-deep",
  hisobot: "bg-teal-soft text-[#0c6d62]",
  shakl: "bg-[#fae7e2] text-[#c9553f]",
  boshqa: "bg-slate-100 text-slate-600",
};
