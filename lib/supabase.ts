import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// True only once both env vars are set (i.e. after you connect Supabase in
// Vercel → Settings → Environment Variables). Until then the site renders
// with the built-in fallback data instead of crashing.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

// Singleton client — safe to import anywhere in the app.
// When env vars are missing we still hand back a valid (placeholder) client so
// importing this module never throws during build; data helpers short-circuit
// on `isSupabaseConfigured` before ever using it.
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseKey ?? 'placeholder-anon-key',
)
