/**
 * Admin roles and what each may do. This map is the only place permissions are defined: code checks
 * `can(role, permission)`, never role names directly.
 */

export const ADMIN_ROLES = ["owner", "admin", "support", "viewer"] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

const ALL: readonly AdminRole[] = ADMIN_ROLES
const STAFF: readonly AdminRole[] = ["owner", "admin", "support"]
const MANAGERS: readonly AdminRole[] = ["owner", "admin"]

export const PERMISSIONS = {
  "admin.view": ALL,
  "users.read": ALL,
  "billing.read": ALL,
  "content.read": ALL,
  "audit.read": ALL,
  "system.read": ALL,
  /** Grant or deduct credits up to the support cap. */
  "credits.adjust": STAFF,
  /** Credit adjustments above the support cap. */
  "credits.adjust.large": MANAGERS,
  "accounts.status": MANAGERS,
  "accounts.notes": STAFF,
  "orders.reverify": STAFF,
  "orders.refund": MANAGERS,
  "sites.unpublish": STAFF,
  "content.moderate": MANAGERS,
  "content.feature": MANAGERS,
  "reports.resolve": STAFF,
  "safety.write": MANAGERS,
  "settings.write": MANAGERS,
  "export.csv": STAFF,
  "admins.manage": ["owner"],
} as const satisfies Record<string, readonly AdminRole[]>

export type Permission = keyof typeof PERMISSIONS

export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  return Boolean(role) && (PERMISSIONS[permission] as readonly AdminRole[]).includes(role!)
}

export const isAdminRole = (v: unknown): v is AdminRole => typeof v === "string" && (ADMIN_ROLES as readonly string[]).includes(v)

/** Default maximum credits a support agent can grant or deduct in one action. */
export const DEFAULT_SUPPORT_CREDIT_CAP = 100
