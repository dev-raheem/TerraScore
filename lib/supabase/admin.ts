import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Import only inside Server Actions /
// Route Handlers, never into a client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
