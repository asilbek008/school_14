import { MARK_ARCH, MARK_DIGITS, MARK_KEYSTONE, MARK_VIEWBOX } from "./mark";

/**
 * The school mark: a two-centred pointed arch — the gate of a school courtyard — with the numerals
 * cut out of it and a gold keystone at the apex. The geometry lives in mark.ts, written by
 * scripts/make-mark.py, so the site, the app icon and anything printed draw the same shape.
 *
 * The arch takes `currentColor`, so a parent sets it with a text colour. `hole` is the colour of
 * the numerals: it must match whatever sits behind the mark, since the digits read as holes cut
 * through it. No gradients and no ids — several copies of this live on one page.
 */
export default function Mark({
  className = "h-10 w-auto",
  hole = "fill-navy",
  keystone = true,
}: {
  className?: string;
  hole?: string;
  keystone?: boolean;
}) {
  return (
    <svg viewBox={MARK_VIEWBOX} className={`shrink-0 ${className}`} aria-hidden="true">
      <path d={MARK_ARCH} fill="currentColor" />
      {keystone && <path d={MARK_KEYSTONE} className="fill-gold" />}
      <path d={MARK_DIGITS} className={hole} />
    </svg>
  );
}
