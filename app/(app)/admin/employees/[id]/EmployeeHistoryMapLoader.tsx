"use client";

import dynamic from "next/dynamic";
import type { LiveOfficeSummary, LocationHistoryPoint } from "@/lib/location";

// next/dynamic's ssr:false option is only usable from a Client Component —
// this file exists purely so the Server Component page can render the map
// without importing Leaflet (which touches `window`) on the server.
const EmployeeHistoryMap = dynamic(() => import("./EmployeeHistoryMap"), { ssr: false });

export default function EmployeeHistoryMapLoader({
  office,
  points,
}: {
  office: LiveOfficeSummary | null;
  points: LocationHistoryPoint[];
}) {
  return <EmployeeHistoryMap office={office} points={points} />;
}
