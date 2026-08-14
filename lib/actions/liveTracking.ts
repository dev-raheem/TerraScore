"use server";

// Called directly (not via a <form>) from the admin live-tracking page's
// polling hook on an interval — so unlike a normal page render, there's no
// requireHr() redirect guarding each call. assertHr() here is the actual
// authorization boundary for every poll.
import { assertHr } from "@/lib/actions/guard";
import { loadLiveLocations } from "@/lib/location";

export async function getLiveLocations() {
  await assertHr();
  return loadLiveLocations();
}
