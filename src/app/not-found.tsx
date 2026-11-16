import Link from "next/link"
import { AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-red-100 p-4 text-red-600 mb-4">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">404 - Page Not Found</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
      >
        Return to Dashboard
      </Link>
    </div>
  )
}
