"use client"

import { useState } from "react"
import { Users, FileCheck2, Tag, Loader2 } from "lucide-react"
import { CustomerRegistrationSection } from "./CustomerRegistrationSection"
import { SkuPricingSection } from "./SkuPricingSection"
import { getPricingCustomersAction } from "@/app/actions/pricing"

export function CustomerPageTabs({
  customersContent,
  registrations,
  masterPrices,
  initialPricingCustomers = [],
  initialTab = "CUSTOMERS",
}: {
  customersContent: React.ReactNode
  registrations: any[]
  masterPrices: any[]
  initialPricingCustomers?: any[]
  initialTab?: "CUSTOMERS" | "PRICING" | "REGISTRATIONS"
}) {
  const [tab, setTab] = useState<"CUSTOMERS" | "PRICING" | "REGISTRATIONS">(initialTab)
  const [pricingCustomers, setPricingCustomers] = useState<any[]>(initialPricingCustomers)
  const [loadingPricing, setLoadingPricing] = useState(false)

  const pendingCount = registrations.filter(r => r.status === "PENDING").length

  const handleSelectTab = async (selected: "CUSTOMERS" | "PRICING" | "REGISTRATIONS") => {
    setTab(selected)
    if (selected === "PRICING" && pricingCustomers.length === 0) {
      setLoadingPricing(true)
      try {
        const fetched = await getPricingCustomersAction()
        setPricingCustomers(fetched)
      } catch (err) {
        console.error("Failed to load customer pricing matrix:", err)
      } finally {
        setLoadingPricing(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => handleSelectTab("CUSTOMERS")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
            tab === "CUSTOMERS"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="h-4 w-4" /> Customer Master List
        </button>

        <button
          onClick={() => handleSelectTab("PRICING")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
            tab === "PRICING"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Tag className="h-4 w-4" /> SKU Pricing Matrix
        </button>

        <button
          onClick={() => handleSelectTab("REGISTRATIONS")}
          className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
            tab === "REGISTRATIONS"
              ? "bg-cyan-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileCheck2 className="h-4 w-4" /> Pending Registrations (Google Form)
          {pendingCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-slate-950 animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {tab === "CUSTOMERS" && customersContent}

      {tab === "PRICING" && (
        loadingPricing ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
            <p className="font-black text-slate-900 text-sm">Loading SKU Pricing Matrix...</p>
            <p className="text-xs text-slate-500 mt-1">Retrieving pricing configurations on demand</p>
          </div>
        ) : (
          <SkuPricingSection
            masterPrices={masterPrices}
            customers={pricingCustomers}
          />
        )
      )}

      {tab === "REGISTRATIONS" && (
        <CustomerRegistrationSection
          registrations={registrations}
          onRefresh={() => window.location.reload()}
        />
      )}
    </div>
  )
}
