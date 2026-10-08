import "server-only"
import { z } from "zod"
import { adminDb } from "@/lib/admin/api"
import { getBillingStore, type Order } from "@/lib/billing/store"

/** Helpers shared by the /api/admin/billing/orders/[id]/* action routes. */

export type IdContext = { params: Promise<{ id: string }> }

/** An error that adminRoute turns into a JSON { error } response with this status. */
export const fail = (message: string, status = 400) => Object.assign(new Error(message), { status })

export const reasonField = z.string().trim().min(3, "Add a reason (at least 3 characters)").max(300)

/** Requires Supabase (the file ledger is never used by the admin panel), then loads the order. */
export async function loadOrder(id: string): Promise<Order> {
  adminDb()
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw fail("Order not found", 404)
  const order = await getBillingStore().getOrder(id)
  if (!order) throw fail("Order not found", 404)
  return order
}
