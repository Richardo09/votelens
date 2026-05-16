import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let supabaseClient: SupabaseClient | null = null;
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL belum diatur di .env.local.");
  }

  if (!supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diatur di .env.local."
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      storage:
        typeof window !== "undefined" ? window.sessionStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}