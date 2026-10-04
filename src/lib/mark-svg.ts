import { MARK_ARCH, MARK_DIGITS, MARK_KEYSTONE, MARK_VIEWBOX } from "@/components/mark";

const [, , VW, VH] = MARK_VIEWBOX.split(" ").map(Number);

/** The mark's aspect: it is taller than it is wide, so a caller sizes it by height. */
export const MARK_RATIO = VW / VH;

/**
 * The mark as standalone SVG markup. `next/og` cannot read a React component into an image, so the
 * icon routes hand it this instead — the same arch, keystone and numerals the site draws.
 */
export function markSvg({
  arch = "#ffffff",
  hole = "#0a1126",
  keystone = "#d9942a",
  height = 100,
}: { arch?: string; hole?: string; keystone?: string; height?: number } = {}) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" width="${Math.round(height * MARK_RATIO)}" height="${height}">` +
    `<path d="${MARK_ARCH}" fill="${arch}"/>` +
    `<path d="${MARK_KEYSTONE}" fill="${keystone}"/>` +
    `<path d="${MARK_DIGITS}" fill="${hole}"/>` +
    `</svg>`
  );
}

/** The same markup as a data URI, which is what an `<img>` inside an ImageResponse needs. */
export const markDataUri = (options?: Parameters<typeof markSvg>[0]) =>
  `data:image/svg+xml;base64,${Buffer.from(markSvg(options)).toString("base64")}`;
