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
  /** The score, for the seal. */
  percent: number;
  /** "26.09.2026". */
  date: string;
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

/** A rounded rectangle path. */
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * The design: a navy band on the left (the "14" crest, the school, the score seal with a laurel of rays), the
 * text on warm paper on the right, the site's tricolour rule, a guilloche-like line pattern in the corner, and a
 * signature/date row at the bottom.
 */
export async function drawCertificate(d: CertificateData): Promise<HTMLCanvasElement> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const { sans, display } = fonts();
  const navy = "#13204a";
  const navy2 = "#1d2f6b";
  const gold = "#d8952b";
  const goldLight = "#f4c46b";
  const ink = "#26304d";
  const muted = "#5b6788";
  const band = 560;

  // Paper and a fine line pattern in the lower-right corner.
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.strokeStyle = "rgba(216,149,43,0.13)";
  ctx.lineWidth = 2;
  for (let r = 60; r < 900; r += 26) {
    ctx.beginPath();
    ctx.arc(W + 60, H + 60, r, Math.PI, 1.5 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  // The navy band.
  const g = ctx.createLinearGradient(0, 0, band, H);
  g.addColorStop(0, navy2);
  g.addColorStop(1, navy);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, band, H);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.arc(band / 2, H / 2, 160 + i * 70, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.stroke();
  }
  // Tricolour edge of the band.
  [["#2c5ce0", 0], ["#128c7e", 1], [gold, 2]].forEach(([c, i]) => {
    ctx.fillStyle = c as string;
    ctx.fillRect(band - 14, (H / 3) * (i as number), 14, H / 3);
  });

  ctx.textAlign = "center";
  // The crest: a white badge with "14".
  rounded(ctx, band / 2 - 70, 110, 140, 140, 32);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.fillStyle = navy;
  ctx.font = `800 78px ${display}`;
  ctx.fillText("14", band / 2 - 7, 205);
  ctx.fillStyle = gold;
  ctx.fillRect(band / 2 - 38, 222, 76, 8);
  ctx.fillStyle = "#c7d0ea";
  ctx.font = `600 30px ${sans}`;
  wrap(ctx, d.school.toUpperCase(), band - 120)
    .slice(0, 3)
    .forEach((l, i) => ctx.fillText(l, band / 2 - 7, 320 + i * 42));

  // The score seal: rays, a gold disc, the percent.
  const cx = band / 2 - 7;
  const cy = H - 420;
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 36; i++) {
    ctx.rotate((Math.PI * 2) / 36);
    ctx.fillStyle = i % 2 ? goldLight : gold;
    ctx.beginPath();
    ctx.moveTo(0, -150);
    ctx.lineTo(14, -178);
    ctx.lineTo(-14, -178);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const disc = ctx.createRadialGradient(cx - 40, cy - 40, 20, cx, cy, 150);
  disc.addColorStop(0, goldLight);
  disc.addColorStop(1, gold);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 128, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = navy;
  ctx.font = `800 92px ${display}`;
  ctx.fillText(`${d.percent}%`, cx, cy + 32);
  ctx.fillStyle = "#c7d0ea";
  ctx.font = `500 28px ${sans}`;
  ctx.fillText(d.date, cx, H - 150);

  // The text column.
  const x = band + (W - band) / 2;
  const col = W - band - 260;
  ctx.fillStyle = gold;
  ctx.font = `700 32px ${sans}`;
  ctx.fillText("✦  ✦  ✦", x, 190);
  ctx.fillStyle = navy;
  let hs = 120;
  ctx.font = `800 ${hs}px ${display}`;
  while (ctx.measureText(d.heading.toUpperCase()).width > col && hs > 60) ctx.font = `800 ${(hs -= 4)}px ${display}`;
  ctx.fillText(d.heading.toUpperCase(), x, 320);
  ctx.fillStyle = muted;
  ctx.font = `500 38px ${sans}`;
  ctx.fillText(d.lead, x, 410);

  ctx.fillStyle = navy;
  let size = 100;
  ctx.font = `700 ${size}px ${display}`;
  while (ctx.measureText(d.name).width > col && size > 48) ctx.font = `700 ${(size -= 4)}px ${display}`;
  ctx.fillText(d.name, x, 560);
  const ul = Math.min(col, Math.max(420, ctx.measureText(d.name).width + 80));
  const ug = ctx.createLinearGradient(x - ul / 2, 0, x + ul / 2, 0);
  ug.addColorStop(0, "rgba(216,149,43,0)");
  ug.addColorStop(0.5, gold);
  ug.addColorStop(1, "rgba(216,149,43,0)");
  ctx.fillStyle = ug;
  ctx.fillRect(x - ul / 2, 595, ul, 5);

  ctx.fillStyle = ink;
  ctx.font = `500 42px ${sans}`;
  wrap(ctx, d.line, col).slice(0, 3).forEach((l, i) => ctx.fillText(l, x, 680 + i * 58));

  // The details as a pill.
  ctx.font = `700 36px ${sans}`;
  const pw = ctx.measureText(d.details).width + 80;
  rounded(ctx, x - pw / 2, 880, pw, 72, 36);
  ctx.fillStyle = "#eef2ff";
  ctx.fill();
  ctx.fillStyle = navy2;
  ctx.fillText(d.details, x, 929);

  // Signature and date lines.
  ctx.strokeStyle = "#c9cfdf";
  ctx.lineWidth = 2;
  [x - 330, x + 330].forEach((sx) => {
    ctx.beginPath();
    ctx.moveTo(sx - 200, H - 190);
    ctx.lineTo(sx + 200, H - 190);
    ctx.stroke();
  });
  ctx.fillStyle = muted;
  ctx.font = `500 28px ${sans}`;
  ctx.fillText(d.footer, x - 330, H - 150);
  ctx.fillText(d.date, x + 330, H - 150);
  ctx.fillStyle = "#8b93ab";
  ctx.font = `400 24px ${sans}`;
  ctx.fillText(d.note, x, H - 80);
  return canvas;
}

/** A one-page A4 (landscape) PDF showing the JPEG full-page. */
export async function canvasToPdf(canvas: HTMLCanvasElement, orientation: "landscape" | "portrait" = "landscape"): Promise<Blob> {
  const jpeg = new Uint8Array(await (await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92))).arrayBuffer());
  const enc = new TextEncoder();
  const [pw, ph] = orientation === "portrait" ? [595, 842] : [842, 595];
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
