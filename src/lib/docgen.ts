// The document generator (owner's request): the admin picks a template, fills a few fields and gets a
// one-page A4 PDF. Everything is drawn in the browser on a canvas, like the test certificate, so no
// library is needed and nothing the admin types is sent anywhere.

import { school } from "@/lib/school";

/**
 * The school's exact legal name is not confirmed yet (the owner will send it), so the generator asks for it
 * and remembers what was typed; this is only the suggestion in the field.
 */
export const defaultSchoolName = "Qiziriq tumani 14-sonli umumta’lim maktabi";

export type DocField = {
  name: string;
  label: string;
  /** "text" | "date" | "long" — long is a textarea. */
  kind?: "text" | "date" | "long";
  hint?: string;
  required?: boolean;
  /** Filled in when the form opens. */
  preset?: "today" | "director" | "school";
};

export type DocTemplate = {
  id: string;
  name: string;
  /** The heading printed on the page. */
  heading: string;
  /** A short note under the heading in the admin form. */
  about: string;
  fields: DocField[];
  /** The paragraphs of the document; empty strings become blank lines. */
  body: (v: Record<string, string>) => string[];
};

const who = (v: Record<string, string>) => `${v.name || "________________"}${v.birth ? ` (tug‘ilgan sanasi: ${v.birth})` : ""}`;

export const templates: DocTemplate[] = [
  {
    id: "malumotnoma",
    name: "O‘quvchi ma’lumotnomasi",
    heading: "MA’LUMOTNOMA",
    about: "O‘quvchining maktabda o‘qiyotgani haqida — turli tashkilotlarga taqdim etish uchun.",
    fields: [
      { name: "school", label: "Maktab nomi", required: true, preset: "school" },
      { name: "name", label: "O‘quvchining F.I.Sh.", required: true },
      { name: "birth", label: "Tug‘ilgan sanasi", hint: "Masalan: 12.05.2014" },
      { name: "cls", label: "Sinfi", hint: "Masalan: 8-A", required: true },
      { name: "year", label: "O‘quv yili", hint: "Masalan: 2026–2027" },
      { name: "purpose", label: "Qayerga taqdim etiladi", hint: "Masalan: yashash joyidagi mahalla fuqarolar yig‘iniga" },
      { name: "number", label: "Ma’lumotnoma raqami" },
      { name: "date", label: "Sanasi", kind: "date", preset: "today" },
      { name: "signer", label: "Imzolovchi", preset: "director" },
    ],
    body: (v) => [
      `Ushbu ma’lumotnoma ${who(v)}ga berildiki, u haqiqatan ham ${v.school || defaultSchoolName}ning ${v.cls || "____"} sinfida${
        v.year ? ` ${v.year} o‘quv yilida` : ""
      } o‘qiydi.`,
      "",
      `Ma’lumotnoma ${v.purpose || "talab qilingan joyga"} taqdim etish uchun berildi.`,
    ],
  },
  {
    id: "tavsifnoma",
    name: "O‘quvchi tavsifnomasi",
    heading: "TAVSIFNOMA",
    about: "O‘quvchining o‘zlashtirishi va xulqi haqida — sinf rahbari yozadi.",
    fields: [
      { name: "school", label: "Maktab nomi", required: true, preset: "school" },
      { name: "name", label: "O‘quvchining F.I.Sh.", required: true },
      { name: "birth", label: "Tug‘ilgan sanasi" },
      { name: "cls", label: "Sinfi", required: true },
      { name: "text", label: "Tavsif matni", kind: "long", required: true, hint: "O‘zlashtirishi, faolligi, ishtirok etgan tanlovlari." },
      { name: "purpose", label: "Qayerga taqdim etiladi" },
      { name: "date", label: "Sanasi", kind: "date", preset: "today" },
      { name: "signer", label: "Imzolovchi", preset: "director" },
    ],
    body: (v) => [
      `${who(v)} — ${v.school || defaultSchoolName}ning ${v.cls || "____"} sinf o‘quvchisi.`,
      "",
      ...(v.text || "").split("\n").map((line) => line.trim()),
      "",
      v.purpose ? `Tavsifnoma ${v.purpose} taqdim etish uchun berildi.` : "",
    ],
  },
  {
    id: "xodim",
    name: "Ish joyidan ma’lumotnoma",
    heading: "MA’LUMOTNOMA",
    about: "Xodimning maktabda ishlayotgani haqida.",
    fields: [
      { name: "school", label: "Maktab nomi", required: true, preset: "school" },
      { name: "name", label: "Xodimning F.I.Sh.", required: true },
      { name: "position", label: "Lavozimi", required: true },
      { name: "since", label: "Qaysi sanadan beri ishlaydi", hint: "Masalan: 2019-yil 2-sentabrdan" },
      { name: "purpose", label: "Qayerga taqdim etiladi" },
      { name: "number", label: "Ma’lumotnoma raqami" },
      { name: "date", label: "Sanasi", kind: "date", preset: "today" },
      { name: "signer", label: "Imzolovchi", preset: "director" },
    ],
    body: (v) => [
      `Ushbu ma’lumotnoma ${v.name || "________________"}ga berildiki, u haqiqatan ham ${v.school || defaultSchoolName}da ${
        v.position || "____________"
      } lavozimida${v.since ? ` ${v.since}` : ""} ishlab kelmoqda.`,
      "",
      `Ma’lumotnoma ${v.purpose || "talab qilingan joyga"} taqdim etish uchun berildi.`,
    ],
  },
  {
    id: "ruxsatnoma",
    name: "Tadbirga ruxsatnoma",
    heading: "RUXSATNOMA",
    about: "Sinfning maktabdan tashqari tadbirga borishi haqida — ota-onaga beriladi.",
    fields: [
      { name: "school", label: "Maktab nomi", required: true, preset: "school" },
      { name: "cls", label: "Sinfi", required: true },
      { name: "event", label: "Tadbir nomi", required: true },
      { name: "place", label: "O‘tkaziladigan joyi" },
      { name: "when", label: "Qachon", hint: "Masalan: 2026-yil 15-oktabr, soat 09:00" },
      { name: "teacher", label: "Mas’ul o‘qituvchi", required: true },
      { name: "date", label: "Sanasi", kind: "date", preset: "today" },
      { name: "signer", label: "Imzolovchi", preset: "director" },
    ],
    body: (v) => [
      `${v.school || defaultSchoolName}ning ${v.cls || "____"} sinf o‘quvchilariga «${v.event || "____________"}» tadbirida ishtirok etishga ruxsat beriladi.`,
      "",
      `Joyi: ${v.place || "____________"}.`,
      `Vaqti: ${v.when || "____________"}.`,
      `Mas’ul o‘qituvchi: ${v.teacher || "____________"}.`,
      "",
      "O‘quvchilar xavfsizligi uchun mas’ul o‘qituvchi javobgar.",
    ],
  },
];

export const templateById = (id: string) => templates.find((t) => t.id === id) ?? templates[0];

/** "27.09.2026" — the browsers here have no Uzbek month names, so the date is written in figures. */
export function docDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}.${m}.${y}` : iso;
}

const W = 1414;
const H = 2000;

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws the filled-in document on an A4 page (portrait). */
export function drawDocument(template: DocTemplate, values: Record<string, string>): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const sans = getComputedStyle(document.body).fontFamily || "sans-serif";
  const margin = 150;
  const width = W - margin * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Letterhead: the school, its address and phone, then the site's tricolour rule.
  ctx.fillStyle = "#10214b";
  ctx.font = `700 40px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText(values.school || defaultSchoolName, W / 2, margin);
  ctx.font = `400 26px ${sans}`;
  ctx.fillStyle = "#5b6580";
  const head = [school.address?.uz, school.phone].filter(Boolean).join(" · ");
  if (head) ctx.fillText(head, W / 2, margin + 46);

  const ruleY = margin + 80;
  const third = width / 3;
  ["#2c5ce0", "#0f8f86", "#d9a300"].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(margin + third * i, ruleY, third, 5);
  });

  // Heading and, when there is one, the document number.
  ctx.fillStyle = "#10214b";
  ctx.font = `800 52px ${sans}`;
  ctx.fillText(template.heading, W / 2, ruleY + 120);
  if (values.number) {
    ctx.font = `400 26px ${sans}`;
    ctx.fillStyle = "#5b6580";
    ctx.fillText(`№ ${values.number}`, W / 2, ruleY + 160);
  }

  // The body, left aligned, with blank lines between paragraphs.
  ctx.textAlign = "left";
  ctx.fillStyle = "#1c2536";
  ctx.font = `400 30px ${sans}`;
  let y = ruleY + 240;
  for (const paragraph of template.body(values)) {
    if (!paragraph) {
      y += 26;
      continue;
    }
    for (const line of wrap(ctx, paragraph, width)) {
      ctx.fillText(line, margin, y);
      y += 46;
    }
  }

  // Signature row at the foot of the page.
  const footY = H - margin - 60;
  ctx.font = `400 28px ${sans}`;
  ctx.fillStyle = "#1c2536";
  if (values.date) ctx.fillText(docDate(values.date), margin, footY - 60);
  ctx.fillText(values.signer || "Maktab direktori", margin, footY);
  ctx.strokeStyle = "#a9b2c6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W - margin - 320, footY - 8);
  ctx.lineTo(W - margin, footY - 8);
  ctx.stroke();
  ctx.font = `400 22px ${sans}`;
  ctx.fillStyle = "#8a93a8";
  ctx.textAlign = "center";
  ctx.fillText("imzo, muhr", W - margin - 160, footY + 30);

  return canvas;
}
