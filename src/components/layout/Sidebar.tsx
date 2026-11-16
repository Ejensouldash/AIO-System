"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Factory, 
  Warehouse, 
  Users, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  X,
  PackageCheck,
  ClipboardList,
  ShieldCheck,
  FileSpreadsheet
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
  const isSuperAdmin = role === "SUPERADMIN"
  const userModules = new Set(user?.modules || [])

  const hasAccess = (mod: string) => isSuperAdmin || userModules.has(mod)
  const hasAnyAccess = (mods: string[]) => isSuperAdmin || mods.some(m => userModules.has(m))

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    production: true,
    warehouse: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Control Tower Dashboard */}
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            pathname === "/dashboard"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
          }`}
          title="Supply Chain Control Tower"
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Control Tower</span>}
        </Link>

        {/* Sales Ordering */}
        {showSOD && (
          <Link
            href="/forms/sales-ordering"
            onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname.startsWith("/forms/sales-ordering")
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
            }`}
            title="Sales Ordering"
          >
            <ShoppingCart className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Sales Ordering</span>}
          </Link>
        )}

        {/* Production Accordion */}
        {showProduction && (
          <div>
            {!isCollapsed ? (
              <>
                <button
                  onClick={() => toggleSection("production")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Factory className="h-5 w-5 shrink-0" />
                    <span>Production</span>
                  </div>
                  {openSections.production ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openSections.production && (
                  <div className="ml-8 mt-1 space-y-1">
                    <Link
                      href="/forms/production"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname === "/forms/production"
                          ? "bg-slate-800 text-cyan-400 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Forms Home & Reports
                    </Link>
                    <Link
                      href="/forms/production/daily-report"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname.startsWith("/forms/production/daily-report")
                          ? "bg-slate-800 text-cyan-400 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Daily KAR Logs
                    </Link>
                    <Link
                      href="/forms/production/handover/new"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname.startsWith("/forms/production/handover")
                          ? "bg-slate-800 text-cyan-400 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Handover Form
                    </Link>
                    <Link
                      href="/forms/production/stock"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname.startsWith("/forms/production/stock")
                          ? "bg-slate-800 text-cyan-400 font-bold"
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
                href="/forms/production"
                onClick={onMobileClose}
                className="flex justify-center py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white"
                title="Production"
              >
                <Factory className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}

        {/* Warehouse & Logistics Accordion */}
        {showWarehouse && (
          <div>
            {!isCollapsed ? (
              <>
                <button
                  onClick={() => toggleSection("warehouse")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Warehouse className="h-5 w-5 shrink-0" />
                    <span>Warehouse & Logistics</span>
                  </div>
                  {openSections.warehouse ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {openSections.warehouse && (
                  <div className="ml-8 mt-1 space-y-1">
                    <Link
                      href="/forms/warehouse/dashboard"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname === "/forms/warehouse/dashboard"
                          ? "bg-slate-800 text-cyan-400 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Live Inventory & Transfers
                    </Link>
                    <Link
                      href="/forms/warehouse/distribution"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname.startsWith("/forms/warehouse/distribution")
                          ? "bg-slate-800 text-cyan-400 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Distribution Orders (DO)
                    </Link>
                    <Link
                      href="/forms/warehouse/gatepass"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname === "/forms/warehouse/gatepass" || (pathname.startsWith("/forms/warehouse/gatepass") && !pathname.includes("/security"))
                          ? "bg-slate-800 text-cyan-400 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Gatepass Planning
                    </Link>
                    <Link
                      href="/forms/warehouse/gatepass/security"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname.startsWith("/forms/warehouse/gatepass/security")
                          ? "bg-slate-800 text-cyan-400 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Security Gate Scanner
                    </Link>
                    <Link
                      href="/forms/warehouse/reports/raw-material"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname.startsWith("/forms/warehouse/reports/raw-material")
                          ? "bg-slate-800 text-cyan-400 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      Material Withdrawal
                    </Link>
                    <Link
                      href="/forms/warehouse/quarantine"
                      onClick={onMobileClose}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pathname.startsWith("/forms/warehouse/quarantine")
                          ? "bg-slate-800 text-cyan-400 font-bold"
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
                href="/forms/warehouse/dashboard"
                onClick={onMobileClose}
                className="flex justify-center py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white"
                title="Warehouse & Logistics"
              >
                <Warehouse className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}

        <div className="my-1 border-t border-slate-800/80"></div>

        {/* Administration: Users (SuperAdmin only) */}
        {isSuperAdmin && (
          <Link
            href="/users"
            onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname.startsWith("/users")
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
          onClick={onMobileClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            pathname.startsWith("/settings")
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
