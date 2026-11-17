"use client"

import { useState, useEffect, useRef } from "react"
import { LogOut, User, Menu, PanelLeftClose, PanelLeftOpen, Bell, Truck, ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

export type IncomingSalesOrderSummary = {
  id: string
  internalSoNo: string
  customerName: string
  poNumber: string | null
  totalCartons: number
  submittedAt: string
}

export function Topbar({ 
  user, 
  onMenuClick,
  isCollapsed,
  onToggleCollapse,
  initialIncomingOrders = []
}: { 
  user: any, 
  onMenuClick?: () => void,
  isCollapsed?: boolean,
  onToggleCollapse?: () => void,
  initialIncomingOrders?: IncomingSalesOrderSummary[]
}) {
  const pathname = usePathname()
  const [orders, setOrders] = useState<IncomingSalesOrderSummary[]>(initialIncomingOrders)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isWarehouseStaff =
    user?.role === "SUPERADMIN" ||
    (Array.isArray(user?.modules) && user.modules.includes("WAREHOUSE"))

  // Keep notifications fresh via background polling for warehouse staff
  useEffect(() => {
    if (!isWarehouseStaff) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/warehouse/notifications")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.incomingSalesOrders)) {
            setOrders(data.incomingSalesOrders)
          }
        }
      } catch (err) {
        // Ignore network polling glitches silently
      }
    }

    const interval = setInterval(fetchNotifications, 30_000)
    const handleFocus = () => fetchNotifications()
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [isWarehouseStaff])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isDropdownOpen])

  let title = "Control Tower Dashboard"
  if (pathname.includes("/forms/warehouse/trace")) title = "DO Traceability & Logistics"
  else if (pathname.includes("/forms/warehouse/gatepass/security")) title = "Security Gate Scanner"
  else if (pathname.includes("/forms/warehouse/gatepass")) title = "Gatepass Planning"
  else if (pathname.includes("/forms/warehouse/distribution")) title = "Distribution Orders"
  else if (pathname.includes("/forms/warehouse/quarantine")) title = "Quarantine & Returns"
  else if (pathname.includes("/forms/warehouse/reports/raw-material")) title = "Raw Material Withdrawal"
  else if (pathname.includes("/forms/warehouse/overview")) title = "Warehouse Overview"
  else if (pathname.includes("/forms/warehouse/dashboard")) title = "Live Inventory & Transfers"
  else if (pathname.includes("/forms/warehouse")) title = "Warehouse Management"
  else if (pathname.includes("/forms/production/daily-report")) title = "Daily KAR Shift Logs"
  else if (pathname.includes("/forms/production/handover")) title = "Production Handover"
  else if (pathname.includes("/forms/production/stock")) title = "Production Stock"
  else if (pathname.includes("/forms/production/hold-items")) title = "Production Quarantine (Hold)"
  else if (pathname.includes("/forms/production/transfer-in")) title = "Raw Material Transfer-In"
  else if (pathname.includes("/forms/dashboard")) title = "Production Dashboard"
  else if (pathname.includes("/forms/production")) title = "Production Operations"
  else if (pathname.includes("/forms/sales-ordering/customers")) title = "Customer Master Directory"
  else if (pathname.includes("/forms/sales-ordering/credit-check")) title = "PO-SOA Credit Evaluation"
  else if (pathname.includes("/forms/sales-ordering/intake")) title = "PO Upload & Intake Queue"
  else if (pathname.includes("/forms/sales-ordering/orders")) title = "Sales Orders"
  else if (pathname.includes("/forms/sales-ordering/documents")) title = "Document Control"
  else if (pathname.includes("/forms/sales-ordering")) title = "Sales Ordering Department"
  else if (pathname.includes("/users")) title = "User Administration"
  else if (pathname.includes("/settings")) title = "Account & Profile Settings"

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-30 transition-colors">
      <div className="flex items-center min-w-0">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="mr-3 md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
            aria-label="Open Mobile Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
            className="hidden md:flex mr-3 p-2 -ml-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors items-center justify-center"
            aria-label="Toggle Sidebar Collapse"
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5 text-cyan-600" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        )}
        <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight truncate">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Warehouse Incoming Sales Order Notification Bell */}
        {isWarehouseStaff && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Warehouse Notifications: Incoming Sales Orders"
              aria-label="Incoming Sales Orders"
            >
              <Bell className="h-5 w-5" />
              {orders.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-sm animate-pulse">
                  {orders.length > 99 ? "99+" : orders.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-black tracking-tight">Incoming Sales Orders</span>
                  </div>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-black text-amber-300">
                    {orders.length} Awaiting DO
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <div className="p-6 text-center text-xs font-semibold text-slate-500">
                      No pending Sales Orders awaiting DO at this time.
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-slate-900 truncate">
                              {order.internalSoNo}
                            </p>
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {order.customerName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {order.poNumber ? `PO: ${order.poNumber}` : "Direct Sales Order"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-xs font-black text-amber-700 border border-amber-200">
                            {order.totalCartons.toLocaleString()} CTN
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-slate-400">
                            {new Date(order.submittedAt).toLocaleTimeString("en-MY", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <Link
                            href={`/forms/warehouse/distribution/new?soId=${order.id}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="inline-flex items-center gap-1 font-black text-cyan-600 hover:text-cyan-700"
                          >
                            Create DO <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-2.5 text-center">
                  <Link
                    href="/forms/warehouse/overview"
                    onClick={() => setIsDropdownOpen(false)}
                    className="inline-flex items-center gap-1 text-xs font-black text-slate-700 hover:text-slate-950"
                  >
                    Open Warehouse Overview <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <Link 
          href="/settings"
          className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer"
          title="Profile & Settings"
        >
          <div className="bg-cyan-100 p-1.5 rounded-full group-hover:bg-cyan-200 transition-colors">
            <User className="h-4 w-4 text-cyan-700" />
          </div>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 hidden sm:block">{user.name}</span>
        </Link>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center text-sm font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </header>
  )
}
