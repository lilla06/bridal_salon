import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'))

let supabase = null

if (!hasSupabaseConfig) {
  console.error('[supabaseClient] ❌ Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')

  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => {
        throw new Error('Supabase is not configured. Add your .env.local values.')
      },
      signUp: async () => {
        throw new Error('Supabase is not configured. Add your .env.local values.')
      },
      signOut: async () => ({ error: null }),
    },
    from: () => {
      throw new Error('Supabase is not configured. Add your .env.local values.')
    },
  }
} else {
  console.log('[supabaseClient] ✅ Using REAL Supabase with Auth (RLS enforced)')
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export { supabase }
