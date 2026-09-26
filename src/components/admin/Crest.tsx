// Solid fills only: a gradient id would clash between copies (the hidden sidebar's copy would blank the others).
/** The school's "14" badge for the admin panel: a round crest with a graduation cap and an open book. */
export default function Crest({ className = "size-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#fff" />
      <circle cx="32" cy="32" r="28.5" fill="#15297a" stroke="#2c5ce0" strokeWidth="1.5" />
      {/* Cap */}
      <path d="M32 9.5 19.5 15l12.5 5.5L44.5 15z" fill="#fff" />
      <path d="M24.5 17.3v3.6c0 1.8 3.4 3.1 7.5 3.1s7.5-1.3 7.5-3.1v-3.6L32 20.6z" fill="#dfe7ff" />
      <path d="M43.2 15.6v5.2" stroke="#d9942a" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="43.2" cy="21.6" r="1.3" fill="#d9942a" />
      {/* 14 */}
      <text x="32" y="42.5" textAnchor="middle" fontFamily="var(--font-inter), system-ui, sans-serif" fontWeight="800" fontSize="17" fill="#fff" letterSpacing="-0.5">
        14
      </text>
      {/* Open book */}
      <path d="M17.5 47.5c4.6-1.6 9.4-1.2 14.5 1.4 5.1-2.6 9.9-3 14.5-1.4v3.2c-4.6-1.4-9.4-1-14.5 1.5-5.1-2.5-9.9-2.9-14.5-1.5z" fill="#d9942a" />
      <path d="M32 48.9v3.3" stroke="#0f1f4d" strokeWidth="0.9" />
    </svg>
  );
}
