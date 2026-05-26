import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = (value) => {
  try {
    return Boolean(value) && new URL(value).protocol.startsWith('http')
  } catch {
    return false
  }
}

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && Boolean(supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

// Fall back to a syntactically valid placeholder so the app still loads
// (createClient throws on an invalid URL). Auth calls will fail until real
// credentials are provided in .env.local.
export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
