/**
 * Admin links. On admin.funcoinlab.com pages live at clean URLs (/users); on localhost and previews
 * they live under /admin. The layout passes the right `base` down, so the same code works on both.
 */
export const adminHref = (base: string, path = "/") => (path === "/" ? base || "/" : `${base}${path}`)
