import Image from "next/image";

/**
 * A photo shown whole (never cropped or stretched) on a blurred, enlarged copy of itself. Tall and
 * small photos — typical for Telegram — fill the frame gracefully instead of leaving empty bars.
 */
export default function PhotoFrame({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-brand-soft ${className}`}>
      <Image src={src} alt="" aria-hidden fill sizes="64px" className="scale-125 object-cover opacity-70 blur-2xl" />
      <Image src={src} alt={alt} fill priority={priority} sizes="(min-width: 1024px) 1024px, 100vw" className="object-contain" />
    </div>
  );
}
