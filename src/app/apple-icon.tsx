import { ImageResponse } from "next/og";

// Home-screen icon on iPhones (they ignore the web manifest's icons).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "white", color: "#131a2e", fontSize: 84, fontWeight: 800 }}>
        14
        <div style={{ width: 64, height: 7, borderRadius: 7, background: "#e0a33e", marginTop: 4 }} />
      </div>
    ),
    size,
  );
}
