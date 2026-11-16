"use client"

import { LogOut, User, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

export function Topbar({ 
  user, 
  onMenuClick,
  isCollapsed,
  onToggleCollapse
}: { 
  user: any, 
  onMenuClick?: () => void,
  isCollapsed?: boolean,
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname()

  let title = "Control Tower Dashboard"
  if (pathname.includes("/forms/warehouse/trace")) title = "DO Traceability & Logistics"
  else if (pathname.includes("/forms/warehouse/gatepass/security")) title = "Security Gate Scanner"
  else if (pathname.includes("/forms/warehouse/gatepass")) title = "Gatepass Planning"
  else if (pathname.includes("/forms/warehouse/distribution")) title = "Distribution Orders"
  else if (pathname.includes("/forms/warehouse/quarantine")) title = "Quarantine & Returns"
  else if (pathname.includes("/forms/warehouse/reports/raw-material")) title = "Raw Material Withdrawal"
  else if (pathname.includes("/forms/warehouse")) title = "Warehouse Management"
  else if (pathname.includes("/forms/production/daily-report")) title = "Daily KAR Shift Logs"
  else if (pathname.includes("/forms/production/handover")) title = "Production Handover"
  else if (pathname.includes("/forms/production/stock")) title = "Production Stock"
  else if (pathname.includes("/forms/production/hold-items")) title = "Production Quarantine (Hold)"
  else if (pathname.includes("/forms/production/transfer-in")) title = "Raw Material Transfer-In"
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
      <div className="flex items-center">
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
        <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
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
        
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        
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
