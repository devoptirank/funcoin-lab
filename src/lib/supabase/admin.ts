import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let admin: SupabaseClient | null | undefined

/**
 * Service-role client. All user data is read and written through the server with this client,
 * scoped to the signed-in wallet's account id. Server-only; never import from client code.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (admin !== undefined) return admin
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  admin = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
  return admin
}
