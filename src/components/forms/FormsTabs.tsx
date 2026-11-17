"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ClipboardList, LayoutDashboard, History, AlertTriangle } from "lucide-react"

export function FormsTabs({ role }: { role?: string }) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const currentPath = pendingHref || pathname

  const isDashboard = currentPath === "/forms/dashboard" || currentPath.startsWith("/forms/dashboard/")
  const isStock = currentPath.startsWith("/forms/production/stock")
  const isHold = currentPath.startsWith("/forms/production/hold-items")
  const isHome = (currentPath === "/forms/production" || currentPath.startsWith("/forms/production/")) && !isStock && !isHold

  return (
    <div className="mb-8 border-b border-gray-200 overflow-x-auto">
      <div className="flex space-x-8 min-w-max px-2">
        {/* 1. Dashboard */}
        <Link 
          href="/forms/dashboard"
          onClick={() => setPendingHref("/forms/dashboard")}
          className={`flex items-center pb-4 text-sm font-black uppercase tracking-wider border-b-4 transition-colors ${
            isDashboard
              ? "border-indigo-500 text-indigo-700" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-2" />
          Dashboard
        </Link>

        {/* 2. Forms Home */}
        <Link 
          href="/forms/production"
          onClick={() => setPendingHref("/forms/production")}
          className={`flex items-center pb-4 text-sm font-black uppercase tracking-wider border-b-4 transition-colors ${
            isHome
              ? "border-emerald-500 text-emerald-700" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <ClipboardList className="w-5 h-5 mr-2" />
          Forms Home
        </Link>

        {/* 3. Production Stock */}
        <Link 
          href="/forms/production/stock"
          onClick={() => setPendingHref("/forms/production/stock")}
          className={`flex items-center pb-4 text-sm font-black uppercase tracking-wider border-b-4 transition-colors ${
            isStock
              ? "border-amber-500 text-amber-700" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <History className="w-5 h-5 mr-2" />
          Production Stock
        </Link>

        {/* 4. Quarantine (Hold) */}
        <Link 
          href="/forms/production/hold-items"
          onClick={() => setPendingHref("/forms/production/hold-items")}
          className={`flex items-center pb-4 text-sm font-black uppercase tracking-wider border-b-4 transition-colors ${
            isHold
              ? "border-rose-500 text-rose-700" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          Quarantine (Hold)
        </Link>
      </div>
    </div>
  )
}
