"use client"

/** Last resort when the root layout itself fails. Plain markup: providers and styles may be gone. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  console.error("[app] root crashed:", error)
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0c0b11", color: "#f3f2f6", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ opacity: 0.7, margin: "0 0 20px" }}>Please reload the page.</p>
          <button onClick={() => window.location.reload()} style={{ background: "#c6f432", color: "#0c0b11", border: 0, borderRadius: 999, padding: "12px 24px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
