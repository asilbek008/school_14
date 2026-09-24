import { ImageResponse } from "next/og";
import { locales } from "@/i18n/config";

// The picture shown when a page of the site is shared (Telegram, Facebook…), unless the page has its own
// (a news story with a cover). Latin text only: the built-in font has no Cyrillic, so every language
// gets the same school name.
export const alt = "14-sonli umumta’lim maktabi — Qiziriq tumani";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Drawn once per language at build time.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px 0",
          color: "white",
          background: "radial-gradient(900px 500px at 85% -10%, #2c5ce0 0%, transparent 60%), radial-gradient(700px 420px at 0% 110%, #128c7e 0%, transparent 60%), #131a2e",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "white",
              color: "#131a2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontWeight: 800,
            }}
          >
            14
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 800 }}>14-maktab</div>
            <div style={{ fontSize: 28, color: "#aeb8d4" }}>Rasmiy sayt</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>14-sonli umumta’lim maktabi</div>
          <div style={{ fontSize: 32, color: "#d6dcee" }}>Surxondaryo viloyati, Qiziriq tumani</div>
        </div>
        <div style={{ display: "flex", height: 14, marginLeft: -80, marginRight: -80 }}>
          <div style={{ flex: 1, background: "#2c5ce0" }} />
          <div style={{ flex: 1, background: "#17a090" }} />
          <div style={{ flex: 1, background: "#e0a33e" }} />
        </div>
      </div>
    ),
    size,
  );
}
