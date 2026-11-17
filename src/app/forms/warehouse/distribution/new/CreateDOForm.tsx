"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { createDistributionOrder } from "@/app/actions/warehouse"
import { Loader2, Plus, Trash2, Save, FileText, Truck, QrCode, Calculator, Tag, Building2, CheckCircle2 } from "lucide-react"
import { SearchableSelect } from "@/components/forms/SearchableSelect"
import { GMPHeader } from "@/components/GMPHeader"
import { QRScannerModal } from "@/components/forms/QRScannerModal"

const DISTRIBUTION_METHODS = [
  "Logistic",
  "SPX",
  "JNT",
  "NinjaVan",
  "Direct Customer",
  "Pickup",
  "Sponsorship"
]

const DEFAULT_SKU_CONFIG = [
  { sku: "p425_24", name: "BUBBLES O2 425 ML x 24", defaultPrice: 24.0, uom: "CTN" },
  { sku: "p425_6", name: "BUBBLES O2 425 ML x 6", defaultPrice: 7.0, uom: "CTN" },
  { sku: "p800_12", name: "BUBBLES O2 800 ML x 12", defaultPrice: 21.0, uom: "CTN" },
  { sku: "p800_20", name: "BUBBLES O2 800 ML x 20", defaultPrice: 35.0, uom: "CTN" },
]

export type CustomerOption = {
  id: string
  customerCode: string
  legalName: string
  tradingName?: string
  address?: string
}

export type ProductOption = {
  sku: string
  name: string
  defaultPrice: number
  uom?: string
}

export type InitialSalesOrderData = {
  id: string
  internalSoNo: string
  poNumber?: string | null
  customerId: string
  customerName: string
  customerCode?: string
  deliveryAddress?: string | null
  items: Array<{
    sku?: string | null
    description: string
    qtyOrdered: number
    uom: string
  }>
} | null

export function CreateDOForm({
  availableInventory,
  userId,
  customers = [],
  products = [],
  initialSalesOrder = null,
}: {
  availableInventory: any[]
  userId: string
  customers?: CustomerOption[]
  products?: ProductOption[]
  initialSalesOrder?: InitialSalesOrderData
}) {
  const [loading, setLoading] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [customerPrices, setCustomerPrices] = useState<Record<string, { price: number; isCustom: boolean }>>({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [showOnlyOrdered, setShowOnlyOrdered] = useState<boolean>(
    Boolean(initialSalesOrder && initialSalesOrder.items && initialSalesOrder.items.length > 0)
  )

  const activeProducts = useMemo(() => {
    if (products && products.length > 0) return products
    return DEFAULT_SKU_CONFIG
  }, [products])

  const isProductOrdered = useCallback((prod: any) => {
    if (!initialSalesOrder || !initialSalesOrder.items || initialSalesOrder.items.length === 0) return true
    return initialSalesOrder.items.some((it) => {
      if (it.sku && it.sku.toLowerCase() === prod.sku.toLowerCase()) return true
      const desc = (it.description || "").toLowerCase()
      const sku = prod.sku.toLowerCase()
      if (desc.includes(sku)) return true
      if (prod.sku === "p425_24" && desc.includes("425") && desc.includes("24")) return true
      if (prod.sku === "p425_6" && desc.includes("425") && desc.includes("6")) return true
      if (prod.sku === "p800_12" && desc.includes("800") && desc.includes("12")) return true
      if (prod.sku === "p800_20" && desc.includes("800") && desc.includes("20")) return true
      return false
    })
  }, [initialSalesOrder])

  const getOrderedQtyForProduct = useCallback((prod: any): number => {
    if (!initialSalesOrder || !initialSalesOrder.items) return 0
    const matched = initialSalesOrder.items.filter((it) => {
      if (it.sku && it.sku.toLowerCase() === prod.sku.toLowerCase()) return true
      const desc = (it.description || "").toLowerCase()
      const sku = prod.sku.toLowerCase()
      if (desc.includes(sku)) return true
      if (prod.sku === "p425_24" && desc.includes("425") && desc.includes("24")) return true
      if (prod.sku === "p425_6" && desc.includes("425") && desc.includes("6")) return true
      if (prod.sku === "p800_12" && desc.includes("800") && desc.includes("12")) return true
      if (prod.sku === "p800_20" && desc.includes("800") && desc.includes("20")) return true
      return false
    })
    return matched.reduce((sum, it) => sum + (it.qtyOrdered || 0), 0)
  }, [initialSalesOrder])

  const initialItems = useMemo(() => {
    return activeProducts.map((p) => {
      // Find matching item in initialSalesOrder if present
      const soItem = initialSalesOrder?.items.find((it) => {
        if (it.sku && it.sku.toLowerCase() === p.sku.toLowerCase()) return true
        if (it.description && p.name && (
          it.description.toLowerCase().includes(p.sku.toLowerCase()) ||
          it.description.toLowerCase().includes(p.name.toLowerCase()) ||
          (p.sku === "p425_24" && it.description.includes("425") && it.description.includes("24")) ||
          (p.sku === "p425_6" && it.description.includes("425") && it.description.includes("6")) ||
          (p.sku === "p800_12" && it.description.includes("800") && it.description.includes("12")) ||
          (p.sku === "p800_20" && it.description.includes("800") && it.description.includes("20"))
        )) return true
        return false
      })

      if (soItem && soItem.qtyOrdered > 0) {
        // Find available batches for this SKU in availableInventory
        const batchesForSku = availableInventory.filter((inv: any) => {
          if (!inv.sku || inv.availableBalance <= 0) return false
          const invSku = inv.sku.toLowerCase().replace(/[^a-z0-9]/g, "")
          const targetSku = p.sku.toLowerCase().replace(/[^a-z0-9]/g, "")
          if (invSku === targetSku) return true
          if (targetSku.includes("42524") && invSku.includes("42524")) return true
          if (targetSku.includes("4256") && invSku.includes("4256")) return true
          if (targetSku.includes("80020") && invSku.includes("80020")) return true
          if (targetSku.includes("80012") && invSku.includes("80012")) return true
          return false
        })

        // Auto-select the first batch with sufficient balance, or the first available batch
        const bestBatch = batchesForSku.find((b: any) => b.availableBalance >= soItem.qtyOrdered) || batchesForSku[0]
        const defaultBatch = bestBatch ? bestBatch.batchNumber : ""

        return {
          sku: p.sku,
          batches: [
            {
              batchNumber: defaultBatch,
              qtySent: soItem.qtyOrdered,
            }
          ]
        }
      }
      return { sku: p.sku, batches: [] }
    })
  }, [activeProducts, initialSalesOrder, availableInventory])

  const { register, control, handleSubmit, watch, setValue, getValues } = useForm<any>({
    defaultValues: {
      distributionDate: new Date().toISOString().slice(0, 10),
      customerId: initialSalesOrder?.customerId || "",
      destination: initialSalesOrder?.deliveryAddress || initialSalesOrder?.customerName || "",
      distributionMethod: "Logistic",
      sponsorshipDetails: "",
      vehicleNo: "",
      driverName: "",
      items: initialItems,
    }
  })

  // Watch fields for live calculations
  const watchMethod = watch("distributionMethod")
  const watchCustomerId = watch("customerId")
  const watchItems = watch("items")

  // Load prices whenever selected customer changes
  useEffect(() => {
    if (!watchCustomerId) {
      const defMap: Record<string, { price: number; isCustom: boolean }> = {}
      for (const s of activeProducts) {
        defMap[s.sku] = { price: s.defaultPrice, isCustom: false }
      }
      setCustomerPrices(defMap)
      return
    }

    setLoadingPrices(true)
    fetch(`/api/pricing/customer/${watchCustomerId}`)
      .then(res => res.json())
      .then(data => {
        if (data.prices && Array.isArray(data.prices)) {
          const priceMap: Record<string, { price: number; isCustom: boolean }> = {}
          for (const p of data.prices) {
            priceMap[p.sku] = {
              price: Number(p.customerPrice ?? p.defaultPrice),
              isCustom: Boolean(p.isCustom)
            }
          }
          setCustomerPrices(priceMap)
        }
      })
      .catch(err => console.error("Failed to load customer prices", err))
      .finally(() => setLoadingPrices(false))
  }, [watchCustomerId, activeProducts])

  // Compute live quantities and prices
  const pricingSummary = useMemo(() => {
    let totalBoxes = 0
    let grandTotal = 0

    const lines = activeProducts.map((prod) => {
      const skuIndex = activeProducts.findIndex(s => s.sku === prod.sku)
      const skuGroup = watchItems?.[skuIndex]
      const batches = skuGroup?.batches || []
      const boxes = batches.reduce((sum: number, b: any) => sum + (Number(b?.qtySent) || 0), 0)
      
      const priceMeta = customerPrices[prod.sku] || { price: prod.defaultPrice, isCustom: false }
      const unitPrice = priceMeta.price
      const lineTotal = Math.round(boxes * unitPrice * 100) / 100

      totalBoxes += boxes
      grandTotal += lineTotal

      return {
        sku: prod.sku,
        label: prod.name,
        boxes,
        unitPrice,
        isCustom: priceMeta.isCustom,
        lineTotal
      }
    })

    return {
      lines,
      totalBoxes,
      grandTotal: Math.round(grandTotal * 100) / 100
    }
  }, [watchItems, customerPrices, activeProducts])

  const handleScan = (decodedText: string) => {
    let scannedBatch = ""
    let scannedSku = ""
    const text = decodedText.trim()

    if (text.startsWith("{") && text.endsWith("}")) {
      try {
        const parsed = JSON.parse(text)
        if (parsed.batch) scannedBatch = String(parsed.batch).trim()
        if (parsed.sku) scannedSku = String(parsed.sku).trim()
      } catch (e) {}
    }

    if (!scannedBatch && (text.includes("batch=") || text.includes("?"))) {
      try {
        const dummyUrl = text.startsWith("http") ? text : `http://localhost/${text.startsWith("?") ? text : "?" + text}`
        const urlObj = new URL(dummyUrl)
        const bParam = urlObj.searchParams.get("batch")
        const sParam = urlObj.searchParams.get("sku")
        if (bParam) scannedBatch = bParam.trim()
        if (sParam) scannedSku = sParam.trim()
      } catch (e) {}
    }

    if (!scannedBatch) {
      scannedBatch = text
    }

    if (!scannedBatch) {
      alert("Unable to read batch number from scanned QR code.")
      setIsScannerOpen(false)
      return
    }

    let matchingBatches = availableInventory.filter(
      (b: any) => b.batchNumber.trim().toUpperCase() === scannedBatch.toUpperCase()
    )

    if (scannedSku && matchingBatches.length > 0) {
      const exactSkuMatches = matchingBatches.filter(
        (b: any) => b.sku.trim().toLowerCase() === scannedSku.toLowerCase()
      )
      if (exactSkuMatches.length > 0) {
        matchingBatches = exactSkuMatches
      }
    }

    if (matchingBatches.length === 0) {
      alert(`Batch ${scannedBatch} not found in active inventory!`)
      setIsScannerOpen(false)
      return
    }

    const batchData = matchingBatches[0]
    const skuIndex = activeProducts.findIndex(s => s.sku === batchData.sku)
    if (skuIndex === -1) {
      alert(`SKU ${batchData.sku} is not configured in this form.`)
      setIsScannerOpen(false)
      return
    }

    const currentBatches = getValues(`items.${skuIndex}.batches`) || []
    if (currentBatches.some((b: any) => b.batchNumber.toUpperCase() === batchData.batchNumber.toUpperCase())) {
      alert(`Batch ${batchData.batchNumber} (${activeProducts[skuIndex].name}) is already added to the list!`)
      setIsScannerOpen(false)
      return
    }

    const currentList = getValues(`items.${skuIndex}.batches`) || []
    setValue(`items.${skuIndex}.batches`, [...currentList, { batchNumber: batchData.batchNumber, qtySent: "" }])
    alert(`Batch ${batchData.batchNumber} added under ${activeProducts[skuIndex].name}! Please enter quantity.`)
    setIsScannerOpen(false)
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    
    const formattedItems: any[] = []
    
    for (const skuGroup of data.items) {
      if (skuGroup.batches) {
        for (const batch of skuGroup.batches) {
          const qty = Number(batch.qtySent)
          if (batch.batchNumber && qty > 0) {
            const priceMeta = customerPrices[skuGroup.sku] || { price: 0 }
            const unitPrice = priceMeta.price
            const lineTotal = Math.round(qty * unitPrice * 100) / 100

            formattedItems.push({
              sku: skuGroup.sku,
              batchNumber: batch.batchNumber,
              qtySent: qty,
              unitPrice,
              lineTotal
            })
          }
        }
      }
    }

    if (formattedItems.length === 0) {
      alert("Please add at least one batch with valid quantity to transfer.")
      setLoading(false)
      return
    }

    const payload = {
      distributionDate: data.distributionDate,
      customerId: data.customerId || null,
      soId: initialSalesOrder?.id || null,
      destination: data.destination,
      distributionMethod: data.distributionMethod,
      sponsorshipDetails: data.distributionMethod === 'Sponsorship' ? data.sponsorshipDetails : null,
      vehicleNo: data.vehicleNo || null,
      driverName: data.driverName || null,
      createdById: userId,
      totalAmount: pricingSummary.grandTotal,
      items: formattedItems
    }

    const result = await createDistributionOrder(payload as any)
    if (result.success) {
      alert("Distribution Order created, pricing recorded, and stock deducted!")
      window.location.href = "/forms/warehouse/distribution"
    } else {
      alert("Error: " + result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <GMPHeader />

      {/* Sales Order Reference Banner */}
      {initialSalesOrder && (
        <div className="mb-6 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-black text-white">
                Fulfilling Sales Order
              </span>
              <span className="font-mono text-sm font-black text-slate-900">
                {initialSalesOrder.internalSoNo}
              </span>
            </div>
            <div className="text-xs font-bold text-amber-900">
              Customer: <span className="text-slate-900 font-black">{initialSalesOrder.customerName}</span> {initialSalesOrder.poNumber && `· PO: ${initialSalesOrder.poNumber}`}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Ordered Line Items to Dispatch:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {initialSalesOrder.items.map((it, idx) => (
                <div key={idx} className="rounded-xl border border-amber-200 bg-white p-3 shadow-xs">
                  <p className="text-xs font-black text-slate-900 truncate">{it.description}</p>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-slate-500">{it.sku || "Custom SKU"}</span>
                    <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {it.qtyOrdered.toLocaleString()} {it.uom}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
        {/* SECTION A: DELIVERY INFO */}
        <div className="bg-white p-6 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center border-b-2 border-black pb-3">
            <Truck className="mr-3 w-6 h-6" /> 1. Delivery & Customer Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-2">Transfer Date</label>
              <input type="date" {...register("distributionDate", { required: true })} className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 rounded" />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-600" /> Customer Account (Nama Customer)
              </label>
              <select
                {...register("customerId")}
                onChange={(e) => {
                  const val = e.target.value
                  setValue("customerId", val)
                  if (val) {
                    const cust = customers.find(c => c.id === val)
                    if (cust) {
                      setValue("destination", cust.address || cust.legalName)
                    }
                  }
                }}
                className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-black bg-cyan-50/50 rounded"
              >
                <option value="">-- No Customer / Manual Pricing --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.legalName} ({c.customerCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase tracking-wider">
                  Transfer To: Delivery Address (Alamat Penghantaran)
                </label>
                {watchCustomerId && (
                  <span className="text-[11px] font-black text-cyan-900 bg-cyan-100 border border-cyan-200 px-2 py-0.5 rounded">
                    Customer: {customers.find(c => c.id === watchCustomerId)?.legalName}
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                placeholder="e.g. Lot 12, Ground Floor, KL Sentral, 50470, Kuala Lumpur, MALAYSIA"
                {...register("destination", { required: true })}
                className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-black rounded resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-2">Distribution Method</label>
              <select {...register("distributionMethod")} className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-black bg-white rounded">
                {DISTRIBUTION_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {watchMethod === "Sponsorship" && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2 text-indigo-700">Sponsor To (Fill in the blank)</label>
                <input type="text" placeholder="e.g. Majlis Sukan Negara" {...register("sponsorshipDetails", { required: true })} className="w-full border-2 border-indigo-400 bg-indigo-50 p-3 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded" />
              </div>
            )}

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2 text-gray-500">Lorry / Vehicle No (Optional)</label>
                <input type="text" placeholder="Plate No" {...register("vehicleNo")} className="w-full border-2 border-gray-300 p-3 font-bold focus:outline-none focus:border-black rounded" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2 text-gray-500">Driver Name (Optional)</label>
                <input type="text" placeholder="Name" {...register("driverName")} className="w-full border-2 border-gray-300 p-3 font-bold focus:outline-none focus:border-black rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: ITEM SELECTION */}
        <div className="bg-white p-6 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b-2 border-black pb-3 mb-4 gap-3">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center">
                <FileText className="mr-3 w-6 h-6" /> 2. Items & Batch Selection
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-semibold">Select physical batches and quantities to be dispatched.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {initialSalesOrder && (
                <div className="inline-flex rounded-lg border-2 border-black bg-slate-100 p-0.5 text-xs font-black shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowOnlyOrdered(true)}
                    className={`rounded-md px-3 py-1.5 transition cursor-pointer ${
                      showOnlyOrdered ? "bg-black text-white" : "text-slate-700 hover:text-black"
                    }`}
                  >
                    Ordered SKU Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOnlyOrdered(false)}
                    className={`rounded-md px-3 py-1.5 transition cursor-pointer ${
                      !showOnlyOrdered ? "bg-black text-white" : "text-slate-700 hover:text-black"
                    }`}
                  >
                    All Products
                  </button>
                </div>
              )}
              <button 
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 font-black uppercase text-sm rounded border-2 border-indigo-900 shadow-[2px_2px_0px_0px_rgba(30,27,75,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all cursor-pointer"
              >
                <QrCode className="w-5 h-5 mr-2" /> Scan QR
              </button>
            </div>
          </div>

          {initialSalesOrder && showOnlyOrdered && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-cyan-50 border border-cyan-200 p-3 text-xs text-cyan-950">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-cyan-700 shrink-0" />
                <span>
                  Filtered to products in <strong>{initialSalesOrder.internalSoNo}</strong>. Only ordered SKU batch options are shown below.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOnlyOrdered(false)}
                className="text-xs font-bold text-cyan-800 underline hover:text-cyan-950 shrink-0 ml-2 cursor-pointer"
              >
                Show All Products
              </button>
            </div>
          )}
          
          <div className="space-y-6">
            {activeProducts.map((prod, skuIndex) => {
              const isOrdered = isProductOrdered(prod)
              if (showOnlyOrdered && !isOrdered) return null

              const requiredQty = getOrderedQtyForProduct(prod)
              const allocatedBatches = watchItems?.[skuIndex]?.batches || []
              const totalAllocated = allocatedBatches.reduce((sum: number, b: any) => sum + (Number(b.qtySent) || 0), 0)
              const priceMeta = customerPrices[prod.sku] || { price: prod.defaultPrice, isCustom: false }

              return (
                <div key={prod.sku} className={`border-2 rounded-xl transition-all relative overflow-visible ${
                  isOrdered ? "border-slate-900 shadow-sm" : "border-gray-200"
                }`}>
                  <div className={`p-4 border-b-2 rounded-t-xl flex flex-wrap justify-between items-center gap-2 ${
                    isOrdered ? "bg-slate-100 border-slate-900" : "bg-gray-100 border-gray-200"
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg tracking-tight uppercase text-gray-900">{prod.name}</h3>
                        {requiredQty > 0 && (
                          <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-black text-cyan-900 border border-cyan-300">
                            SO Target: {requiredQty.toLocaleString()} {prod.uom || "CTN"}
                          </span>
                        )}
                      </div>
                      {requiredQty > 0 && (
                        <div className="mt-1 text-xs">
                          {totalAllocated === requiredQty ? (
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Fully Allocated ({totalAllocated}/{requiredQty} {prod.uom || "CTN"})
                            </span>
                          ) : totalAllocated < requiredQty ? (
                            <span className="font-bold text-amber-700">
                              Allocated: {totalAllocated} / {requiredQty} {prod.uom || "CTN"} ({requiredQty - totalAllocated} remaining)
                            </span>
                          ) : (
                            <span className="font-bold text-indigo-700">
                              Allocated: {totalAllocated} / {requiredQty} {prod.uom || "CTN"} (+{totalAllocated - requiredQty} extra)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                        priceMeta.isCustom ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-200 text-slate-700"
                      }`}>
                        <Tag className="w-3 h-3" />
                        RM {priceMeta.price.toFixed(2)} / {prod.uom || "CTN"}
                        {priceMeta.isCustom ? " (Contract Price)" : " (Base Price)"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-b-xl overflow-visible relative">
                    <BatchRows 
                      skuId={prod.sku} 
                      skuIndex={skuIndex} 
                      control={control} 
                      register={register}
                      watchItems={watchItems}
                      availableInventory={availableInventory}
                      setValue={setValue}
                      skuLabel={prod.name}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SECTION C: LIVE PRICING & DELIVERY VALUE PREVIEW */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border-2 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
            <div className="flex items-center gap-2 font-black text-lg uppercase tracking-wider text-cyan-400">
              <Calculator className="w-5 h-5" /> 3. Live Delivery Value Calculation (Auto-Calculated by SKU)
            </div>
            {loadingPrices && (
              <span className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching customer rates...
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-2">SKU</th>
                    <th className="pb-2 text-center">Dispatched Qty</th>
                    <th className="pb-2 text-right">Unit Price (RM)</th>
                    <th className="pb-2 text-right">Line Total (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold">
                  {pricingSummary.lines.map((line) => (
                    <tr key={line.sku} className={line.boxes > 0 ? "text-white" : "text-slate-500"}>
                      <td className="py-2.5">
                        <span className="font-bold">{line.label}</span>
                        {line.isCustom && line.boxes > 0 && (
                          <span className="ml-2 rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[10px] font-black">
                            Customer Rate
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-center font-black">
                        {line.boxes} CTN
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        RM {line.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-cyan-300">
                        RM {line.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Quantity</p>
                <p className="text-2xl font-black text-white">{pricingSummary.totalBoxes.toLocaleString()} Boxes / Cartons</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-cyan-400 font-black uppercase tracking-widest">Total Estimated Delivery Value</p>
                <p className="text-3xl font-black text-emerald-400 font-mono">
                  RM {pricingSummary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center bg-black hover:bg-gray-800 text-white font-black py-5 px-6 text-xl tracking-wide uppercase transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[6px] hover:translate-x-[6px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Save className="w-6 h-6 mr-2" />}
          {loading ? "Processing..." : "Generate Distribution Order (DO)"}
        </button>
      </form>
      
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  )
}

function BatchRows({
  skuId,
  skuIndex,
  control,
  register,
  watchItems,
  availableInventory,
  setValue,
  skuLabel,
}: any) {
  const { fields, remove, append } = useFieldArray({
    control,
    name: `items.${skuIndex}.batches`,
  })

  const availableBatchesForSku = availableInventory.filter((inv: any) => {
    if (!inv.sku || !skuId) return false
    const invSku = inv.sku.toLowerCase().replace(/[^a-z0-9]/g, "")
    const targetSku = skuId.toLowerCase().replace(/[^a-z0-9]/g, "")
    if (invSku === targetSku) return true
    if (targetSku.includes("42524") && invSku.includes("42524")) return true
    if (targetSku.includes("4256") && invSku.includes("4256")) return true
    if (targetSku.includes("80020") && invSku.includes("80020")) return true
    if (targetSku.includes("80012") && invSku.includes("80012")) return true
    return false
  })

  if (availableBatchesForSku.length === 0) {
    return (
      <div className="text-center py-4 px-2">
        <p className="text-sm font-bold text-gray-400 uppercase">Out of Stock</p>
        <p className="text-xs text-gray-400">No active balance available for this SKU in warehouse.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {fields.map((field: any, batchIndex: number) => {
        const currentBatchNo = watchItems?.[skuIndex]?.batches?.[batchIndex]?.batchNumber || ""
        const selectedInventory = availableBatchesForSku.find((inv: any) => inv.batchNumber === currentBatchNo)
        const maxAllowed = selectedInventory ? selectedInventory.availableBalance : 0
        const qtyEntered = Number(watchItems?.[skuIndex]?.batches?.[batchIndex]?.qtySent) || 0
        const isError = maxAllowed > 0 && qtyEntered > maxAllowed

        return (
          <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 border border-gray-300 rounded">
            <div className="flex-1 w-full sm:w-auto">
              <SearchableSelect 
                value={currentBatchNo}
                onChange={(val) => {
                  setValue(`items.${skuIndex}.batches.${batchIndex}.batchNumber`, val)
                }}
                options={availableBatchesForSku.map((inv: any) => ({
                  value: inv.batchNumber,
                  label: `Batch: ${inv.batchNumber} (Available: ${inv.availableBalance} box)`
                }))}
                placeholder="-- Choose Batch --"
              />
            </div>
            
            <div className="w-full sm:w-32 flex-shrink-0">
              <label className="block sm:hidden text-[10px] font-black uppercase text-gray-500 mb-1">Quantity</label>
              <input 
                type="number" 
                min="1"
                max={maxAllowed > 0 ? maxAllowed : undefined}
                placeholder="Qty"
                {...register(`items.${skuIndex}.batches.${batchIndex}.qtySent`, { required: true, min: 1, max: maxAllowed > 0 ? maxAllowed : undefined })}
                className={`w-full border-2 p-2 text-center text-sm font-black outline-none rounded ${
                  isError ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-500' : 'border-black bg-white text-black focus:ring-1 focus:ring-black'
                }`}
              />
            </div>

            <div className="flex items-center justify-end sm:justify-start gap-3 w-full sm:w-auto">
              <span className={`text-[10px] font-bold w-16 text-center ${isError ? 'text-red-600' : 'text-gray-500'}`}>
                Max: {selectedInventory ? maxAllowed : "--"}
              </span>
              <button 
                type="button" 
                onClick={() => remove(batchIndex)} 
                className="text-red-500 hover:bg-red-100 p-2 rounded"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )
      })}

      <div className="pt-2">
        <button 
          type="button" 
          onClick={() => append({ batchNumber: "", qtySent: "" })} 
          className="flex items-center text-xs font-black uppercase tracking-wider bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Batch for {skuLabel}
        </button>
      </div>
    </div>
  )
}
