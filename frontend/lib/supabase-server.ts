import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export function createRouteClient(req: NextRequest) {
  const authorization = req.headers.get("authorization");

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: authorization ? { Authorization: authorization } : {},
      },
    }
  );
}

