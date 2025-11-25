import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export type SupabaseBrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

export function getSupabaseBrowserClient(client?: SupabaseBrowserClient): SupabaseBrowserClient {
  return client ?? createSupabaseBrowserClient();
}
