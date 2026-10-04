import { ImageResponse } from "next/og";
import { MARK_RATIO, markDataUri } from "@/lib/mark-svg";

// The "14" app icon in the sizes the web manifest lists (installed on a phone's home screen).
const sizes = [192, 512];

export function generateStaticParams() {
  return sizes.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = sizes.includes(Number((await params).size)) ? Number((await params).size) : 512;
  // The same mark as the Play Store app (android/play/make-icons.py), so both home screens agree.
  const mark = size * 0.68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a1126",
          backgroundImage:
            "radial-gradient(circle at 78% 12%, #20429e 0%, rgba(32,66,158,0) 58%), radial-gradient(circle at 14% 86%, #0c4a48 0%, rgba(12,74,72,0) 56%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markDataUri({ hole: "#0a1126", height: Math.round(mark) })} width={Math.round(mark * MARK_RATIO)} height={Math.round(mark)} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
