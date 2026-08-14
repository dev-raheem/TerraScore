import "server-only";
import type { NextRequest } from "next/server";

// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when it
// invokes a scheduled cron route, as long as the CRON_SECRET env var is set
// on the project — this is the only thing standing between these routes and
// the open internet, since they're plain unauthenticated HTTP endpoints.
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
