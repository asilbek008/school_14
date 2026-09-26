// A practice-test certificate, made in the browser: drawn on a canvas (the page's own fonts, so Uzbek and Russian
// names both work) and wrapped as a one-page A4 PDF around the JPEG — no library, nothing sent anywhere.

export type CertificateData = {
  school: string;
  heading: string;
  lead: string;
  name: string;
  line: string;
  details: string;
  footer: string;
  note: string;
};

const W = 2000;
const H = Math.round(W / Math.SQRT2);

/** Splits text into lines no wider than `max` at the current font. */
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

/** The fonts the site uses (next/font gives them generated names), read from the page. */
function fonts() {
  const root = getComputedStyle(document.documentElement);
  const sans = getComputedStyle(document.body).fontFamily || "sans-serif";
  const display = root.getPropertyValue("--font-display").trim() || sans;
  return { sans, display: `${display}, ${sans}` };
}

export async function drawCertificate(d: CertificateData): Promise<HTMLCanvasElement> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const { sans, display } = fonts();
  const navy = "#13204a";
  const gold = "#d8952b";

  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, W, H);
  // Frames and the tricolour rule of the site.
  ctx.strokeStyle = navy;
  ctx.lineWidth = 18;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(78, 78, W - 156, H - 156);
  const third = (W - 400) / 3;
  [["#2c5ce0", 0], ["#128c7e", 1], [gold, 2]].forEach(([c, i]) => {
    ctx.fillStyle = c as string;
    ctx.fillRect(200 + third * (i as number), 250, third, 8);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = navy;
  // The "14" badge and the school's name.
  ctx.fillRect(W / 2 - 55, 120, 110, 100);
  ctx.fillStyle = "#fff";
  ctx.font = `800 64px ${display}`;
  ctx.fillText("14", W / 2, 192);
  ctx.fillStyle = "#5b6788";
  ctx.font = `600 34px ${sans}`;
  ctx.fillText(d.school.toUpperCase(), W / 2, 320);

  ctx.fillStyle = navy;
  ctx.font = `800 132px ${display}`;
  ctx.fillText(d.heading.toUpperCase(), W / 2, 480);
  ctx.fillStyle = "#5b6788";
  ctx.font = `500 40px ${sans}`;
  ctx.fillText(d.lead, W / 2, 570);

  ctx.fillStyle = navy;
  let size = 96;
  ctx.font = `700 ${size}px ${display}`;
  while (ctx.measureText(d.name).width > W - 500 && size > 48) ctx.font = `700 ${(size -= 4)}px ${display}`;
  ctx.fillText(d.name, W / 2, 700);
  ctx.fillStyle = gold;
  ctx.fillRect(W / 2 - 360, 730, 720, 5);

  ctx.fillStyle = "#26304d";
  ctx.font = `500 44px ${sans}`;
  wrap(ctx, d.line, W - 520).slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 820 + i * 60));

  ctx.fillStyle = navy;
  ctx.font = `700 42px ${sans}`;
  ctx.fillText(d.details, W / 2, 1040);

  ctx.fillStyle = "#5b6788";
  ctx.font = `500 30px ${sans}`;
  ctx.fillText(d.footer, W / 2, H - 170);
  ctx.fillStyle = "#8b93ab";
  ctx.font = `400 26px ${sans}`;
  ctx.fillText(d.note, W / 2, H - 125);
  return canvas;
}

/** A one-page A4 (landscape) PDF showing the JPEG full-page. */
export async function canvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
  const jpeg = new Uint8Array(await (await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92))).arrayBuffer());
  const enc = new TextEncoder();
  const [pw, ph] = [842, 595];
  const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
  const objects: (string | Uint8Array)[][] = [
    ["<< /Type /Catalog /Pages 2 0 R >>"],
    ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"],
    [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`],
    [
      `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
      jpeg,
      "\nendstream",
    ],
    [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`],
  ];
  const parts: Uint8Array[] = [enc.encode("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  let length = parts[0].length;
  const offsets: number[] = [];
  const push = (p: string | Uint8Array) => {
    const bytes = typeof p === "string" ? enc.encode(p) : p;
    parts.push(bytes);
    length += bytes.length;
  };
  objects.forEach((obj, i) => {
    offsets.push(length);
    push(`${i + 1} 0 obj\n`);
    obj.forEach(push);
    push("\nendobj\n");
  });
  const xref = length;
  push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`);
  push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}
