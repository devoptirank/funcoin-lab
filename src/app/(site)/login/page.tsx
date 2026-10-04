import { Suspense } from "react"
import { BackgroundFX } from "@/components/shared/background-fx"
import { LoginForm } from "@/components/auth/login-form"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({ title: "Sign in", description: "Sign in to FunCoin Lab to sync your meme brands and publish websites.", path: "/login", noindex: true })

export default function LoginPage() {
  return (
    <div className="relative isolate grid min-h-[70vh] place-items-center px-4 py-16">
      <BackgroundFX />
      <div className="glass w-full max-w-md rounded-[2rem] p-8">
        <h1 className="mb-1 text-center font-heading text-3xl font-extrabold">Welcome to the lab 🧪</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">Sign in to sync projects and publish your .fun sites.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
