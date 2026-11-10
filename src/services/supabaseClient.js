import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null

// Check if we should use mock auth (for development/testing)
// IMPORTANT: Set to false when RLS policies are properly configured
const hasSupabaseConfig = supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')
// ⚠️  CHANGED: Default to MOCK AUTH for testing until RLS policies are applied to Supabase database
// To use real Supabase auth: set window.FORCE_REAL_AUTH = true in browser console
const shouldUseMockAuth = typeof window !== 'undefined' ? window.FORCE_REAL_AUTH !== true : true

if (hasSupabaseConfig && !shouldUseMockAuth) {
  // ✅ USE REAL SUPABASE WITH PROPER AUTH
  console.log('[supabaseClient] ✅ Using REAL Supabase with Auth (RLS will be enforced)')
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  // Create a mock object for development/testing
  console.log('[supabaseClient] 🧪 Using MOCK AUTH for testing (Set window.FORCE_REAL_AUTH=true to use real Supabase)')
  
  // Helper: mock update builder that supports chaining of .eq() calls
  const updateBuilder = (table, data) => {
    const builder = {
      eq: function(col, val) {
        console.log(`[supabaseClient] ${table}.update().eq('${col}', '${val}')`)
        return builder
      },
      then: (resolve) => {
        console.log(`[supabaseClient] ${table}.update() TERMINAL - returning success`)
        return Promise.resolve({ data: [data], error: null }).then(resolve)
      },
      catch: (reject) => Promise.resolve({ data: [data], error: null })
    }
    return builder
  }

  supabase = {
    from: (table) => {
      console.log(`[supabaseClient] from('${table}')`)
      
      // Builder object that supports chaining and returns empty data at end
      const queryBuilder = {
        select: function(cols) {
          console.log(`[supabaseClient] ${table}.select()`)
          return queryBuilder
        },
        gte: function(col, val) {
          console.log(`[supabaseClient] ${table}.gte('${col}', '${val}')`)
          return queryBuilder
        },
        lte: function(col, val) {
          console.log(`[supabaseClient] ${table}.lte('${col}', '${val}')`)
          return queryBuilder
        },
        in: function(col, arr) {
          console.log(`[supabaseClient] ${table}.in('${col}', [...])`)
          // This is the last in chain (.select().gte().lte().in()) - return a thenable
          return {
            then: (resolve) => {
              console.log(`[supabaseClient] .in() TERMINAL - returning empty array`)
              return Promise.resolve({ data: [], error: null }).then(resolve)
            },
            catch: (reject) => Promise.resolve({ data: [], error: null })
          }
        },
        eq: function() { return queryBuilder },
        update: function(data) {
          console.log(`[supabaseClient] ${table}.update()`, data)
          return updateBuilder(table, data)
        },
        upsert: function(data, options) {
          console.log(`[supabaseClient] ${table}.upsert()`, { data, options })
          return {
            select: async () => ({ data: [data], error: null }),
            then: (resolve) => Promise.resolve({ data: [data], error: null }).then(resolve),
            catch: (reject) => Promise.resolve({ data: [data], error: null })
          }
        }
      }
      
      return queryBuilder
    },
    auth: {
      signUp: async ({ email, password, options }) => {
        console.log('[supabaseClient] auth.signUp()', { email })
        const mockUser = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
          email,
          ...options?.data
        }
        const session = {
          user: mockUser,
          access_token: 'mock-token-' + Math.random().toString(36).substr(2, 9),
          refresh_token: 'mock-refresh-' + Math.random().toString(36).substr(2, 9)
        }
        localStorage.setItem('mockUser', JSON.stringify(mockUser))
        localStorage.setItem('mockSession', JSON.stringify(session))
        console.log('[supabaseClient] Registered user:', mockUser.id)
        return { data: { user: mockUser }, error: null }
      },
      signInWithPassword: async ({ email, password }) => {
        console.log('[supabaseClient] auth.signInWithPassword()', { email })
        const mockUser = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
          email
        }
        const session = {
          user: mockUser,
          access_token: 'mock-token-' + Math.random().toString(36).substr(2, 9),
          refresh_token: 'mock-refresh-' + Math.random().toString(36).substr(2, 9)
        }
        localStorage.setItem('mockUser', JSON.stringify(mockUser))
        localStorage.setItem('mockSession', JSON.stringify(session))
        console.log('[supabaseClient] Signed in user:', mockUser.id)
        return { data: { user: mockUser }, error: null }
      },
      getSession: async () => {
        const mockSession = localStorage.getItem('mockSession')
        console.log('[supabaseClient] getSession()', { hasSession: !!mockSession })
        return { data: { session: mockSession ? JSON.parse(mockSession) : null } }
      },
      onAuthStateChange: (callback) => {
        console.log('[supabaseClient] onAuthStateChange() registered')
        
        // Check current session immediately
        const mockSession = localStorage.getItem('mockSession')
        const subscription = {
          unsubscribe: () => console.log('[supabaseClient] Unsubscribed from auth state changes')
        }
        
        // IMPORTANT: Call the callback IMMEDIATELY with current session state (NO setTimeout)
        if (mockSession) {
          const session = JSON.parse(mockSession)
          console.log('[supabaseClient] Calling auth callback with SIGNED_IN event for user:', session.user?.email)
          // Call IMMEDIATELY without setTimeout - React will batch updates
          callback('SIGNED_IN', session)
        } else {
          console.log('[supabaseClient] No session in localStorage, calling with SIGNED_OUT')
          callback('SIGNED_OUT', null)
        }
        
        // Listen for storage changes (for multi-tab support)
        const handleStorageChange = (e) => {
          if (e.key === 'mockSession') {
            console.log('[supabaseClient] Storage changed:', e.newValue ? 'session set' : 'session cleared')
            if (e.newValue) {
              callback('SIGNED_IN', JSON.parse(e.newValue))
            } else {
              callback('SIGNED_OUT', null)
            }
          }
        }
        
        window.addEventListener('storage', handleStorageChange)
        
        return { 
          data: { 
            subscription: {
              unsubscribe: () => {
                window.removeEventListener('storage', handleStorageChange)
                console.log('[supabaseClient] Unsubscribed from auth state changes')
              }
            } 
          } 
        }
      },
      signOut: async () => {
        console.log('[supabaseClient] auth.signOut()')
        localStorage.removeItem('mockUser')
        localStorage.removeItem('mockSession')
        return { error: null }
      }
    }
  }
  
  if (hasSupabaseConfig) {
    console.warn('[supabaseClient] ⚠️  Supabase configured but using MOCK AUTH for testing.')
    console.warn('[supabaseClient] 📍 In browser console: window.FORCE_MOCK_AUTH = false  (or reload) to use real Supabase auth')
  } else {
    console.error('[supabaseClient] ❌ Supabase NOT configured! Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
  }
}

export { supabase }
