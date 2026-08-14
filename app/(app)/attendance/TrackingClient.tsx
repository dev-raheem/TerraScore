"use client";

import { useEffect } from "react";
import { submitLocationPing } from "@/lib/actions/attendance";
import { getCurrentPosition } from "@/components/attendance/browserGeolocation";

type Props = {
  active: boolean;
  normalIntervalSeconds: number;
  lowBatteryIntervalSeconds: number;
};

// Renders nothing — runs in the background on the attendance page while an
// active clocked-in session exists and the employee has granted consent.
// Uses a plain interval (not watchPosition) so the update cadence is the
// one thing we control directly, rather than firing on every GPS jitter.
export default function TrackingClient({ active, normalIntervalSeconds, lowBatteryIntervalSeconds }: Props) {
  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function tick() {
      const position = await getCurrentPosition();
      if (cancelled || !position) return;
      await submitLocationPing({
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        clientRecordedAt: new Date().toISOString(),
      });
    }

    async function resolveIntervalMs(): Promise<number> {
      // Battery Status API is Chrome-only and frequently unavailable —
      // fall back to the normal interval rather than assuming low battery.
      try {
        const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
        if (nav.getBattery) {
          const battery = await nav.getBattery();
          if (!battery.charging && battery.level <= 0.2) return lowBatteryIntervalSeconds * 1000;
        }
      } catch {
        // ignore — fall through to the normal interval
      }
      return normalIntervalSeconds * 1000;
    }

    tick();
    resolveIntervalMs().then((ms) => {
      if (cancelled) return;
      timer = setInterval(tick, ms);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [active, normalIntervalSeconds, lowBatteryIntervalSeconds]);

  return null;
}
