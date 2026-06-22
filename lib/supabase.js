import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
