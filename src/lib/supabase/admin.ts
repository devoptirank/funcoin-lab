import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { supabaseUrl } from "./config"

let admin: SupabaseClient | null | undefined

/** Service-role client for billing writes. Server-only; never import from client code. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (admin !== undefined) return admin
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  admin = supabaseUrl && key ? createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
  return admin
}
