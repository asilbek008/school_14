// Where each editable page shows up on the site (the rest of those pages is built from other data).
export const pageInfo: Record<string, { path: string; where: string; title: string }> = {
  about: {
    path: "/about",
    where: "«Maktab» menyusi → Maktab haqida. Matn raqamli kartalardan keyin, «Qisqacha» ustuni yonida chiqadi; rahbariyat va dars vaqtlari avtomatik qo‘shiladi.",
    title: "Banner ustidagi kichik yozuv (katta sarlavha — maktab nomi).",
  },
  admissions: {
    path: "/admissions",
    where: "«Maktab» menyusi → Qabul. Matn qabul qadamlaridan keyin chiqadi; aloqa kartasi avtomatik qo‘shiladi.",
    title: "Sahifa bannerining katta sarlavhasi.",
  },
};

export const languages = [
  { code: "uz", label: "O‘zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
] as const;

type PageRow = Record<string, unknown>;

/** Per language: whether the title and the text are filled in (an empty one falls back to Uzbek on the site). */
export const translationStatus = (row: PageRow) =>
  languages.map((l) => ({ ...l, title: Boolean(row[`title_${l.code}`]), body: Boolean(row[`body_${l.code}`]) }));
