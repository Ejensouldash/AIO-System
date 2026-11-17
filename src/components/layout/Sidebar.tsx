"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Factory, 
  Warehouse, 
  Users, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  X,
  FileCheck,
  FileSearch,
  ShieldCheck,
  Package,
  Truck,
  ClipboardCheck,
  AlertOctagon,
  FileBarChart,
  ClipboardList,
  History,
} from "lucide-react"

export function Sidebar({ 
  role, 
  user, 
  onMobileClose,
  isCollapsed,
  onToggleCollapse
}: { 
  role: string, 
  user: any, 
  onMobileClose?: () => void,
  isCollapsed?: boolean,
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // Clear pendingHref once navigation finishes and pathname updates
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const currentPath = pendingHref || pathname

  const isSuperAdmin = role === "SUPERADMIN"
  const userModules = new Set(user?.modules || [])

  const hasAccess = (mod: string) => isSuperAdmin || userModules.has(mod)
  const hasAnyAccess = (mods: string[]) => isSuperAdmin || mods.some(m => userModules.has(m))

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    salesOrdering: true,
    production: true,
    warehouse: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Sales Ordering tab permission check
  const canSODTab = (tabModule: string) =>
    isSuperAdmin || userModules.has("SALES_ORDERING") || userModules.has(tabModule)

  const sodModules = [
    "SALES_ORDERING",
    "SALES_ORDERING_DASHBOARD",
    "SALES_ORDERING_CUSTOMERS",
    "SALES_ORDERING_DOCUMENTS",
    "SALES_ORDERING_INTAKE",
    "SALES_ORDERING_CREDIT_CHECK",
    "SALES_ORDERING_ORDERS",
  ]

  const showSOD = hasAnyAccess(sodModules)
  const showProduction = hasAnyAccess(["FORMS", "PRODUCTION_STOCK", "HANDOVER", "TRANSFER_IN_HISTORY"])
  const showWarehouse = hasAnyAccess([
    "WAREHOUSE",
    "GATEPASS_REQUESTER",
    "WAREHOUSE_GATEPASS",
    "SECURITY_GATEPASS",
    "RAW_MATERIAL_WITHDRAWAL",
    "PALLET_LEDGER",
  ])

  // Submenu items for Sales Ordering
  const sodSubmenu = [
    ...(canSODTab("SALES_ORDERING_DASHBOARD") ? [{ label: "Dashboard", href: "/forms/sales-ordering" }] : []),
    ...(canSODTab("SALES_ORDERING_CUSTOMERS") ? [{ label: "Customers", href: "/forms/sales-ordering/customers" }] : []),
    ...(canSODTab("SALES_ORDERING_DOCUMENTS") ? [{ label: "Documents", href: "/forms/sales-ordering/documents" }] : []),
    ...(canSODTab("SALES_ORDERING_INTAKE") ? [{ label: "PO Upload", href: "/forms/sales-ordering/intake" }] : []),
    ...(canSODTab("SALES_ORDERING_CREDIT_CHECK") ? [{ label: "PO-SOA Check", href: "/forms/sales-ordering/credit-check" }] : []),
    ...(canSODTab("SALES_ORDERING_ORDERS") ? [{ label: "Sales Orders", href: "/forms/sales-ordering/orders" }] : []),
  ]

  const handleLinkClick = (href: string) => {
    setPendingHref(href)
    if (onMobileClose) onMobileClose()
  }

  return (
    <aside className={`h-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-sm">
              A
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight text-white">AIO System</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Operations</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-black text-white text-base">
              A
            </div>
          </div>
        )}

        {onMobileClose && (
          <button 
            onClick={onMobileClose} 
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {/* Control Tower Dashboard */}
        <Link
          href="/dashboard"
          onClick={() => handleLinkClick("/dashboard")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            currentPath === "/dashboard"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
          }`}
          title="Supply Chain Control Tower"
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Control Tower</span>}
        </Link>

        {/* 1. Sales Ordering Accordion (Split-Click) */}
        {showSOD && (
          <div>
            {!isCollapsed ? (
              <>
                <div
                  className={`flex items-center justify-between rounded-xl transition-all ${
                    currentPath.startsWith("/forms/sales-ordering")
                      ? "bg-slate-800/90 text-white"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Link
                    href="/forms/sales-ordering"
                    onClick={() => handleLinkClick("/forms/sales-ordering")}
                    className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-semibold min-w-0"
                    title="Sales Ordering Dashboard"
                  >
                    <ShoppingCart className="h-5 w-5 shrink-0 text-cyan-400" />
                    <span className="truncate">Sales Ordering</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleSection("salesOrdering")
                    }}
                    className="p-2.5 text-slate-400 hover:text-white transition-colors"
                    aria-label="Toggle Sales Ordering submenu"
                  >
                    {openSections.salesOrdering ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {openSections.salesOrdering && (
                  <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-800 pl-2">
                    {sodSubmenu.map((item) => {
                      const active =
                        item.href === "/forms/sales-ordering"
                          ? currentPath === item.href
                          : currentPath.startsWith(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => handleLinkClick(item.href)}
                          className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            active
                              ? "bg-cyan-600/30 text-cyan-300 font-bold"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          }`}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/forms/sales-ordering"
                onClick={() => handleLinkClick("/forms/sales-ordering")}
                className={`flex justify-center py-2.5 rounded-xl transition ${
                  currentPath.startsWith("/forms/sales-ordering")
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title="Sales Ordering"
              >
                <ShoppingCart className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}

        {/* 2. Production Accordion (Split-Click) */}
        {showProduction && (
          <div>
            {!isCollapsed ? (
              <>
                <div
                  className={`flex items-center justify-between rounded-xl transition-all ${
                    currentPath.startsWith("/forms/production") || currentPath === "/forms/dashboard"
                      ? "bg-slate-800/90 text-white"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Link
                    href="/forms/dashboard"
                    onClick={() => handleLinkClick("/forms/dashboard")}
                    className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-semibold min-w-0"
                    title="Production Dashboard"
                  >
                    <Factory className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="truncate">Production</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleSection("production")
                    }}
                    className="p-2.5 text-slate-400 hover:text-white transition-colors"
                    aria-label="Toggle Production submenu"
                  >
                    {openSections.production ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {openSections.production && (
                  <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-800 pl-2">
                    {/* Strict Order: Dashboard > Forms Home & Reports > Daily KAR Logs > Handover Form > Production Stock */}
                    <Link
                      href="/forms/dashboard"
                      onClick={() => handleLinkClick("/forms/dashboard")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath === "/forms/dashboard"
                          ? "bg-emerald-600/30 text-emerald-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/forms/production"
                      onClick={() => handleLinkClick("/forms/production")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath === "/forms/production"
                          ? "bg-emerald-600/30 text-emerald-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Forms Home & Reports
                    </Link>
                    <Link
                      href="/forms/production/daily-report"
                      onClick={() => handleLinkClick("/forms/production/daily-report")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath.startsWith("/forms/production/daily-report")
                          ? "bg-emerald-600/30 text-emerald-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Daily KAR Logs
                    </Link>
                    <Link
                      href="/forms/production/handover/new"
                      onClick={() => handleLinkClick("/forms/production/handover/new")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath.startsWith("/forms/production/handover")
                          ? "bg-emerald-600/30 text-emerald-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Handover Form
                    </Link>
                    <Link
                      href="/forms/production/stock"
                      onClick={() => handleLinkClick("/forms/production/stock")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath.startsWith("/forms/production/stock")
                          ? "bg-emerald-600/30 text-emerald-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Production Stock
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/forms/dashboard"
                onClick={() => handleLinkClick("/forms/dashboard")}
                className={`flex justify-center py-2.5 rounded-xl transition ${
                  currentPath.startsWith("/forms/production") || currentPath === "/forms/dashboard"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title="Production Dashboard"
              >
                <Factory className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}

        {/* 3. Warehouse & Logistics Accordion (Split-Click) */}
        {showWarehouse && (
          <div>
            {!isCollapsed ? (
              <>
                <div
                  className={`flex items-center justify-between rounded-xl transition-all ${
                    currentPath.startsWith("/forms/warehouse")
                      ? "bg-slate-800/90 text-white"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Link
                    href="/forms/warehouse/overview"
                    onClick={() => handleLinkClick("/forms/warehouse/overview")}
                    className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-semibold min-w-0"
                    title="Warehouse Dashboard"
                  >
                    <Warehouse className="h-5 w-5 shrink-0 text-amber-400" />
                    <span className="truncate">Warehouse & Logistics</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleSection("warehouse")
                    }}
                    className="p-2.5 text-slate-400 hover:text-white transition-colors"
                    aria-label="Toggle Warehouse submenu"
                  >
                    {openSections.warehouse ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {openSections.warehouse && (
                  <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-800 pl-2">
                    {/* Dashboard at the very first position */}
                    <Link
                      href="/forms/warehouse/overview"
                      onClick={() => handleLinkClick("/forms/warehouse/overview")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath === "/forms/warehouse/overview"
                          ? "bg-amber-600/30 text-amber-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/forms/warehouse/dashboard"
                      onClick={() => handleLinkClick("/forms/warehouse/dashboard")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath === "/forms/warehouse/dashboard"
                          ? "bg-amber-600/30 text-amber-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Live Inventory & Transfers
                    </Link>
                    <Link
                      href="/forms/warehouse/distribution"
                      onClick={() => handleLinkClick("/forms/warehouse/distribution")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath.startsWith("/forms/warehouse/distribution")
                          ? "bg-amber-600/30 text-amber-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Distribution Orders (DO)
                    </Link>
                    <Link
                      href="/forms/warehouse/gatepass"
                      onClick={() => handleLinkClick("/forms/warehouse/gatepass")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath === "/forms/warehouse/gatepass" || (currentPath.startsWith("/forms/warehouse/gatepass") && !currentPath.includes("/security"))
                          ? "bg-amber-600/30 text-amber-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Gatepass Planning
                    </Link>
                    <Link
                      href="/forms/warehouse/gatepass/security"
                      onClick={() => handleLinkClick("/forms/warehouse/gatepass/security")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath.startsWith("/forms/warehouse/gatepass/security")
                          ? "bg-amber-600/30 text-amber-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Security Gate Scanner
                    </Link>
                    <Link
                      href="/forms/warehouse/reports/raw-material"
                      onClick={() => handleLinkClick("/forms/warehouse/reports/raw-material")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath.startsWith("/forms/warehouse/reports/raw-material")
                          ? "bg-amber-600/30 text-amber-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Material Withdrawal
                    </Link>
                    <Link
                      href="/forms/warehouse/quarantine"
                      onClick={() => handleLinkClick("/forms/warehouse/quarantine")}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentPath.startsWith("/forms/warehouse/quarantine")
                          ? "bg-amber-600/30 text-amber-300 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Quarantine & Returns
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/forms/warehouse/overview"
                onClick={() => handleLinkClick("/forms/warehouse/overview")}
                className={`flex justify-center py-2.5 rounded-xl transition ${
                  currentPath.startsWith("/forms/warehouse")
                    ? "bg-amber-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title="Warehouse & Logistics"
              >
                <Warehouse className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}

        <div className="my-2 border-t border-slate-800/80"></div>

        {/* Administration: Users (SuperAdmin only) */}
        {isSuperAdmin && (
          <Link
            href="/users"
            onClick={() => handleLinkClick("/users")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              currentPath.startsWith("/users")
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
            }`}
            title="User Management"
          >
            <Users className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>User Management</span>}
          </Link>
        )}

        {/* Settings (All users) */}
        <Link
          href="/settings"
          onClick={() => handleLinkClick("/settings")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            currentPath.startsWith("/settings")
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
          }`}
          title="Account Settings"
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-700/50 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-200 text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || "Operational Staff"}</p>
              <p className="text-[10px] text-cyan-400 font-semibold truncate">{user?.role || "STAFF"}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
