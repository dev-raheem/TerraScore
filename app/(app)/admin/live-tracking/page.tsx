import type { Metadata } from "next";
import { requireHr } from "@/lib/session";
import { loadLiveLocations } from "@/lib/location";
import LiveTrackingClient from "./LiveTrackingClient";

export const metadata: Metadata = { title: "Live Tracking" };

export default async function LiveTrackingPage() {
  await requireHr();
  const { offices, employees } = await loadLiveLocations();

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Live Tracking</div>
          <div className="page-sub">Where every actively tracked employee is right now, relative to your offices.</div>
        </div>
      </div>
      <LiveTrackingClient initialOffices={offices} initialEmployees={employees} />
    </>
  );
}
