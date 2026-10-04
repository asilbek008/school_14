import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Home-screen icon on iPhones (they ignore the web manifest's icons).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const font = await readFile(join(process.cwd(), "assets/fonts/BricolageGrotesque-Bold.ttf"));

  return new ImageResponse(
    (
      // The same mark as the Android app and the web manifest icon.
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
        <div style={{ fontFamily: "Bricolage", fontSize: 93 }}>14</div>
        <div style={{ width: 59, height: 7, borderRadius: 7, background: "#d9942a", marginTop: 5 }} />
      </div>
    ),
    { ...size, fonts: [{ name: "Bricolage", data: font, style: "normal", weight: 700 }] },
  );
}
