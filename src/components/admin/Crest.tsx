import { MARK_ARCH, MARK_DIGITS, MARK_KEYSTONE } from "../mark";

// Solid fills only: a gradient id would clash between copies (the hidden sidebar's copy would blank the others).
/** The school mark set in a ring, for the admin panel's own header. */
export default function Crest({ className = "size-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#15297a" />
      <circle cx="32" cy="32" r="29" fill="none" stroke="#2c5ce0" strokeWidth="1.4" />
      {/* The arch, scaled down and re-centred so it sits inside the ring with room to breathe. */}
      <g transform="translate(32 33.5) scale(0.70) translate(-32 -32)">
        <path d={MARK_ARCH} fill="#fff" />
        <path d={MARK_KEYSTONE} fill="#d9942a" />
        <path d={MARK_DIGITS} fill="#15297a" />
      </g>
    </svg>
  );
}
