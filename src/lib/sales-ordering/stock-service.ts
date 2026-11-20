import { prisma } from "@/lib/prisma"

export type SkuStockSummary = {
  skuKey: "LWI_500_24" | "p425_24" | "p425_6" | "p800_12" | "p800_20"
  name: string
  shortCode: string
  bottleSize: string
  packQty: string
  bottlesPerBox: number
  warehouseBoxes: number
  productionBoxes: number
  totalBoxes: number
  totalBottles: number
  warehouseBatchesCount: number
  productionBatchesCount: number
  status: "HEALTHY" | "MODERATE" | "LOW" | "OUT_OF_STOCK"
  batches: Array<{
    batchNumber: string
    location: "WAREHOUSE" | "PRODUCTION"
    qty: number
  }>
}

export type StockOverviewData = {
  skus: SkuStockSummary[]
  totalWarehouseBoxes: number
  totalProductionBoxes: number
  grandTotalBoxes: number
  lastUpdated: string
}

export function normalizeSkuKey(raw: string): "LWI_500_24" | "p425_24" | "p425_6" | "p800_12" | "p800_20" | null {
  if (!raw) return null
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (clean.includes("500") || clean.includes("lwi")) return "LWI_500_24"
  if (clean.includes("425") && clean.includes("24")) return "p425_24"
  if (clean.includes("425") && clean.includes("6")) return "p425_6"
  if (clean.includes("800") && clean.includes("20")) return "p800_20"
  if (clean.includes("800") && clean.includes("12")) return "p800_12"
  return null
}

const SKU_METADATA = {
  LWI_500_24: {
    skuKey: "LWI_500_24" as const,
    name: "LWI BLUE 500ML X 24",
    shortCode: "500ml x 24",
    bottleSize: "500 ML",
    packQty: "24 Bottles / Carton",
    bottlesPerBox: 24,
  },
  p425_24: {
    skuKey: "p425_24" as const,
    name: "Bubbles O2 Natural Mineral Water 425ml x 24",
    shortCode: "425ml x 24",
    bottleSize: "425 ML",
    packQty: "24 Bottles / Carton",
    bottlesPerBox: 24,
  },
  p425_6: {
    skuKey: "p425_6" as const,
    name: "Bubbles O2 Natural Mineral Water 425ml x 6",
    shortCode: "425ml x 6",
    bottleSize: "425 ML",
    packQty: "6 Bottles / Pack",
    bottlesPerBox: 6,
  },
  p800_20: {
    skuKey: "p800_20" as const,
    name: "Bubbles O2 Natural Mineral Water 800ml x 20",
    shortCode: "800ml x 20",
    bottleSize: "800 ML",
    packQty: "20 Bottles / Carton",
    bottlesPerBox: 20,
  },
  p800_12: {
    skuKey: "p800_12" as const,
    name: "Bubbles O2 Natural Mineral Water 800ml x 12",
    shortCode: "800ml x 12",
    bottleSize: "800 ML",
    packQty: "12 Bottles / Carton",
    bottlesPerBox: 12,
  },
}

export async function getLiveStockOverview(): Promise<StockOverviewData> {
  // 1. Fetch all Warehouse inventory batches with available balance
  const warehouseBatches = await prisma.inventoryBatch.findMany({
    where: { availableBalance: { gt: 0 } },
    orderBy: { updatedAt: "desc" },
  })

  // 2. Fetch all Production batches from approved daily reports
  const approvedProductionOutputs = await prisma.productionOutput.findMany({
    where: {
      report: { status: "APPROVED" },
    },
    include: {
      batches: true,
      report: { select: { date: true, line: true, shift: true } },
    },
  })

  // 3. Fetch all Handover items received into Warehouse
  const receivedHandoverItems = await prisma.handoverItem.findMany({
    where: {
      handover: { status: "RECEIVED" },
    },
    select: {
      batchNo: true,
      category: true,
      netToWarehousePcs: true,
    },
  })

  // Build a lookup map of handed-over quantities by batchNo
  const handedOverByBatch = new Map<string, number>()
  for (const item of receivedHandoverItems) {
    const key = item.batchNo.trim().toUpperCase()
    handedOverByBatch.set(key, (handedOverByBatch.get(key) || 0) + item.netToWarehousePcs)
  }

  // Intermediate containers by normalized SKU
  type SkuAggregator = {
    warehouseBoxes: number
    productionBoxes: number
    warehouseBatches: Array<{ batchNumber: string; qty: number }>
    productionBatches: Array<{ batchNumber: string; qty: number }>
  }

  const aggregates: Record<"LWI_500_24" | "p425_24" | "p425_6" | "p800_12" | "p800_20", SkuAggregator> = {
    LWI_500_24: { warehouseBoxes: 0, productionBoxes: 0, warehouseBatches: [], productionBatches: [] },
    p425_24: { warehouseBoxes: 0, productionBoxes: 0, warehouseBatches: [], productionBatches: [] },
    p425_6: { warehouseBoxes: 0, productionBoxes: 0, warehouseBatches: [], productionBatches: [] },
    p800_20: { warehouseBoxes: 0, productionBoxes: 0, warehouseBatches: [], productionBatches: [] },
    p800_12: { warehouseBoxes: 0, productionBoxes: 0, warehouseBatches: [], productionBatches: [] },
  }

  // Aggregate Warehouse stock
  for (const batch of warehouseBatches) {
    const skuKey = normalizeSkuKey(batch.sku)
    if (skuKey && aggregates[skuKey]) {
      aggregates[skuKey].warehouseBoxes += batch.availableBalance
      aggregates[skuKey].warehouseBatches.push({
        batchNumber: batch.batchNumber,
        qty: batch.availableBalance,
      })
    }
  }

  // Aggregate Production stock (Finished goods produced minus handed over)
  for (const output of approvedProductionOutputs) {
    const skuKey = normalizeSkuKey(output.productType)
    if (!skuKey || !aggregates[skuKey]) continue

    for (const pb of output.batches) {
      const batchKey = pb.batchNo.trim().toUpperCase()
      const alreadyHandedOver = handedOverByBatch.get(batchKey) || 0

      // If this batch has not been fully transferred to warehouse, remaining is production floor stock
      const remainingInProd = Math.max(0, pb.qty - alreadyHandedOver)
      if (remainingInProd > 0) {
        aggregates[skuKey].productionBoxes += remainingInProd
        aggregates[skuKey].productionBatches.push({
          batchNumber: pb.batchNo,
          qty: remainingInProd,
        })
      }
    }
  }

  // Construct SkuStockSummary for active SKUs
  const order: Array<"LWI_500_24" | "p425_24" | "p425_6" | "p800_20" | "p800_12"> = [
    "LWI_500_24",
    "p425_24",
    "p800_20",
    "p800_12",
    "p425_6",
  ]

  let totalWarehouseBoxes = 0
  let totalProductionBoxes = 0

  const skus: SkuStockSummary[] = order.map((skuKey) => {
    const meta = SKU_METADATA[skuKey]
    const agg = aggregates[skuKey]
    const totalBoxes = agg.warehouseBoxes + agg.productionBoxes
    totalWarehouseBoxes += agg.warehouseBoxes
    totalProductionBoxes += agg.productionBoxes

    let status: SkuStockSummary["status"] = "HEALTHY"
    if (totalBoxes === 0) status = "OUT_OF_STOCK"
    else if (totalBoxes < 1000) status = "LOW"
    else if (totalBoxes < 5000) status = "MODERATE"

    const batches = [
      ...agg.warehouseBatches.map((b) => ({
        batchNumber: b.batchNumber,
        location: "WAREHOUSE" as const,
        qty: b.qty,
      })),
      ...agg.productionBatches.map((b) => ({
        batchNumber: b.batchNumber,
        location: "PRODUCTION" as const,
        qty: b.qty,
      })),
    ]

    return {
      skuKey: meta.skuKey,
      name: meta.name,
      shortCode: meta.shortCode,
      bottleSize: meta.bottleSize,
      packQty: meta.packQty,
      bottlesPerBox: meta.bottlesPerBox,
      warehouseBoxes: agg.warehouseBoxes,
      productionBoxes: agg.productionBoxes,
      totalBoxes,
      totalBottles: totalBoxes * meta.bottlesPerBox,
      warehouseBatchesCount: agg.warehouseBatches.length,
      productionBatchesCount: agg.productionBatches.length,
      status,
      batches,
    }
  })

  return {
    skus,
    totalWarehouseBoxes,
    totalProductionBoxes,
    grandTotalBoxes: totalWarehouseBoxes + totalProductionBoxes,
    lastUpdated: new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }),
  }
}
