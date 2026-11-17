"use client"

import { useEffect, useState, useRef, useTransition } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [navigating, setNavigating] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Listen to document link clicks in the capture phase for 0ms immediate feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't intercept if modifier keys are pressed (e.g. Cmd/Ctrl for new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const target = e.target as HTMLElement | null
      const anchor = target?.closest("a") as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href) return

      // Only handle internal navigation
      if (
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !href.startsWith("/api/") &&
        !anchor.hasAttribute("download") &&
        anchor.target !== "_blank"
      ) {
        // Compare with current full URL
        const currentFull = window.location.pathname + window.location.search
        if (href === currentFull) return

        // Start progress immediately
        setNavigating(true)
        setProgress(20)

        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              if (timerRef.current) clearInterval(timerRef.current)
              return 85
            }
            return prev + (85 - prev) * 0.2
          })
        }, 150)
      }
    }

    document.addEventListener("click", handleClick, true)
    return () => {
      document.removeEventListener("click", handleClick, true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // When pathname or searchParams change, navigation has completed!
  useEffect(() => {
    if (navigating) {
      if (timerRef.current) clearInterval(timerRef.current)
      setProgress(100)
      const timeout = setTimeout(() => {
        setNavigating(false)
        setProgress(0)
      }, 250)
      return () => clearTimeout(timeout)
    }
  }, [pathname, searchParams])

  if (!navigating && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none transition-opacity duration-300 overflow-hidden"
      style={{ opacity: navigating || progress > 0 ? 1 : 0 }}
    >
      <div
        className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
