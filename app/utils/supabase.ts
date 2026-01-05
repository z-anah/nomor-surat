import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  useRuntimeConfig().public.supabaseUrl,
  useRuntimeConfig().public.supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage // ✅ browser only
    }
  }
)
