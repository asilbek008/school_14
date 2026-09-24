import { ImageResponse } from "next/og";

// The "14" app icon in the sizes the web manifest lists (installed on a phone's home screen).
const sizes = [192, 512];

export function generateStaticParams() {
  return sizes.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = sizes.includes(Number((await params).size)) ? Number((await params).size) : 512;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#131a2e" }}>
        <div
          style={{
            width: "70%",
            height: "70%",
            borderRadius: "22%",
            background: "white",
            color: "#131a2e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.34,
            fontWeight: 800,
          }}
        >
          14
          <div style={{ width: "38%", height: size * 0.035, borderRadius: size, background: "#e0a33e", marginTop: size * 0.02 }} />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
