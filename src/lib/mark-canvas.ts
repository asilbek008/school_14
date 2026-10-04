import { MARK_ARCH, MARK_DIGITS, MARK_KEYSTONE, MARK_VIEWBOX } from "@/components/mark";

const [VX, VY, VW, VH] = MARK_VIEWBOX.split(" ").map(Number);

/** Width the mark takes at a given height — the arch is taller than it is wide. */
export const markWidth = (height: number) => (height * VW) / VH;

/**
 * Draws the school mark on a canvas, the same shape the site and the app icon use.
 *
 * `x`, `y` is the top-left of the mark's own box and `height` its height; the numerals are painted
 * in `hole`, which must match what sits behind the mark, since they read as holes cut through it.
 */
export function drawMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  { arch = "#ffffff", hole = "#131a2e", keystone = "#d9942a" }: { arch?: string; hole?: string; keystone?: string } = {},
) {
  const scale = height / VH;
  ctx.save();
  ctx.translate(x - VX * scale, y - VY * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = arch;
  ctx.fill(new Path2D(MARK_ARCH));
  if (keystone) {
    ctx.fillStyle = keystone;
    ctx.fill(new Path2D(MARK_KEYSTONE));
  }
  ctx.fillStyle = hole;
  ctx.fill(new Path2D(MARK_DIGITS));
  ctx.restore();
}
