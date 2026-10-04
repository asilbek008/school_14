import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The "14" app icon in the sizes the web manifest lists (installed on a phone's home screen).
const sizes = [192, 512];

export function generateStaticParams() {
  return sizes.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = sizes.includes(Number((await params).size)) ? Number((await params).size) : 512;
  // The site's display face, so the digits match the Android icon drawn by android/play/make-icons.py.
  // Read at build time: these routes are prerendered.
  const font = await readFile(join(process.cwd(), "assets/fonts/BricolageGrotesque-Bold.ttf"));

  return new ImageResponse(
    (
      // The same mark as the Play Store app: the white "14" and its gold rule on the navy of the
      // site's dark blocks, so both home screens show one icon.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          backgroundColor: "#0a1126",
          backgroundImage:
            "radial-gradient(circle at 78% 12%, #20429e 0%, rgba(32,66,158,0) 58%), radial-gradient(circle at 14% 86%, #0c4a48 0%, rgba(12,74,72,0) 56%)",
        }}
      >
        <div style={{ fontFamily: "Bricolage", fontSize: size * 0.52 }}>14</div>
        <div style={{ width: "33%", height: size * 0.04, borderRadius: size, background: "#d9942a", marginTop: size * 0.03 }} />
      </div>
    ),
    { width: size, height: size, fonts: [{ name: "Bricolage", data: font, style: "normal", weight: 700 }] },
  );
}
