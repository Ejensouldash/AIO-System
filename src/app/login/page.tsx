"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { loginWithCredentials } from "@/app/actions/auth"
import { CheckCircle2, Loader2 } from "lucide-react"

function isSafeCallbackUrl(url: string | null): url is string {
  return !!url && url.startsWith("/") && !url.startsWith("//")
}

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrlParam = searchParams.get("callbackUrl")
  const callbackUrl = isSafeCallbackUrl(callbackUrlParam) ? callbackUrlParam : "/dashboard"

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const clientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await loginWithCredentials(formData)
      if (res && !res.success) {
        setError(res.error || "Login failed.")
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.message && err.message.includes('NEXT_REDIRECT')) {
        setIsSuccess(true)
        setTimeout(() => {
          window.location.href = callbackUrl
        }, 1200)
      } else {
        setError("An unexpected error occurred. Please try again.")
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white animate-in fade-in duration-500">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-32 h-32 bg-emerald-500/20 rounded-full animate-ping"></div>
            <div className="absolute w-24 h-24 bg-emerald-500/40 rounded-full animate-pulse"></div>
            <CheckCircle2 className="h-20 w-20 text-emerald-500 relative z-10 animate-in zoom-in-50 spin-in-12 duration-700" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 animate-in slide-in-from-bottom-5 duration-500 delay-150">Login Successful</h2>
          <p className="text-gray-500 mt-2 font-medium animate-in slide-in-from-bottom-5 duration-500 delay-300 flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to Dashboard...
          </p>
        </div>
      )}

      <div className={`w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden transition-all duration-500 ${isSuccess ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-600 to-indigo-600"></div>
        
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
            AIO System
          </h1>
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-600">
            Operations & Supply Chain
          </h2>
          <p className="mt-3 text-sm text-gray-500 font-medium">
            Sign in with your enterprise credentials
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={clientSubmit}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 sm:text-sm transition-colors"
                placeholder="user@aio-system.local"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 mt-4">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 sm:text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center font-medium bg-red-50 py-3 rounded-lg border border-red-100 flex items-center justify-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 px-4 text-sm font-bold text-white hover:from-cyan-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in to Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded-xl"></div>
          <div className="h-12 bg-gray-100 rounded-xl"></div>
          <div className="h-12 bg-cyan-500/20 rounded-xl mt-6"></div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
