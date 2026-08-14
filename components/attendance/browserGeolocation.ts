// Client-only helper — never imported from a Server Component. Wraps the
// browser Geolocation API in a promise that resolves to null (rather than
// throwing) on denied permission, timeout, or an unsupported browser, so
// callers can treat "no location" as a normal, expected outcome.
export type GeoResult = { latitude: number; longitude: number; accuracy: number };

export function getCurrentPosition(timeoutMs = 10000): Promise<GeoResult | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );
  });
}
