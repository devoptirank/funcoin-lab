/** Price formatting shared by the token dashboard and the site-wide ticker. */

export const usdCompact = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", notation: n >= 100_000 ? "compact" : "standard", maximumFractionDigits: n >= 100 ? 0 : 2 })

/** Small prices keep 4 significant digits ($0.000004101) instead of rounding to $0.00. */
export const usdPrice = (n: number) =>
  n >= 1 ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }) : `$${n.toPrecision(4).replace(/0+$/, "").replace(/\.$/, "")}`
