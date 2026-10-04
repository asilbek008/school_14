import { ImageResponse } from "next/og";
import { MARK_RATIO, markDataUri } from "@/lib/mark-svg";

// Home-screen icon on iPhones (they ignore the web manifest's icons).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const mark = Math.round(size.height * 0.68);

  return new ImageResponse(
    (
      // The same mark as the Android app and the web manifest icon.
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
        <img src={markDataUri({ hole: "#0a1126", height: mark })} width={Math.round(mark * MARK_RATIO)} height={mark} alt="" />
      </div>
    ),
    size,
  );
}
