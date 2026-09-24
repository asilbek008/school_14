"use client";

import { useEffect } from "react";
import { setSiteYear } from "@/lib/site-year";

/** Opening a year's page picks that year for the rest of the visit (the current year clears the pick). */
export default function SetSiteYear({ start, current }: { start: number; current: number }) {
  useEffect(() => setSiteYear(start === current ? null : start), [start, current]);
  return null;
}
