"use client"
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config"

let client: SupabaseClient | null = null

/** Browser client, or null when Supabase isn't configured (guest mode). */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
