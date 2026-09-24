"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Native <details> menu (opens without JS) that also closes itself: after a link is chosen,
 * on navigation, on a tap outside and on Escape. Client-side navigation keeps the header
 * mounted, so without this the menu stayed open on the next page.
 */
export default function MobileMenu({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = () => {
      if (ref.current) ref.current.open = false;
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details
      ref={ref}
      className={className}
      onClick={(e) => {
        // A chosen link (same page too) closes the menu.
        if ((e.target as Element).closest("a") && ref.current) ref.current.open = false;
      }}
    >
      {children}
    </details>
  );
}
