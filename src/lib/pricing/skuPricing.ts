import { prisma } from "@/lib/prisma"

export interface SkuDefinition {
  sku: string
  name: string
  defaultPrice: number
  uom: string
  unitsPerPack?: number
  category?: string
}

export const STANDARD_FINISHED_GOOD_SKUS: SkuDefinition[] = [
  { sku: "p425_24", name: "BUBBLES O2 425 ML x 24", defaultPrice: 24.0, uom: "CTN", unitsPerPack: 24, category: "Mineral Water" },
  { sku: "p425_6", name: "BUBBLES O2 425 ML x 6", defaultPrice: 7.0, uom: "CTN", unitsPerPack: 6, category: "Mineral Water" },
  { sku: "p800_12", name: "BUBBLES O2 800 ML x 12", defaultPrice: 21.0, uom: "CTN", unitsPerPack: 12, category: "Mineral Water" },
  { sku: "p800_20", name: "BUBBLES O2 800 ML x 20", defaultPrice: 35.0, uom: "CTN", unitsPerPack: 20, category: "Mineral Water" },
]

export const SKU_LABEL_MAP: Record<string, string> = {
  p425_24: "BUBBLES O2 425 ML x 24",
  p425_6: "BUBBLES O2 425 ML x 6",
  p800_12: "BUBBLES O2 800 ML x 12",
  p800_20: "BUBBLES O2 800 ML x 20",
}

/**
 * Ensures SkuMasterPrice table is seeded with default entries if not yet populated.
 */
export async function ensureDefaultSkuMasterPrices() {
  for (const def of STANDARD_FINISHED_GOOD_SKUS) {
    await prisma.skuMasterPrice.upsert({
      where: { sku: def.sku },
      create: {
        sku: def.sku,
        name: def.name,
        defaultPrice: def.defaultPrice,
        uom: def.uom,
        currency: "MYR",
        category: def.category || "Mineral Water",
        unitsPerPack: def.unitsPerPack || 1,
        isActive: true,
      },
      update: {}, // keep existing prices if already edited
    })
  }
}

/**
 * Get all active products/SKUs in the system.
 */
export async function getAllActiveProducts() {
  await ensureDefaultSkuMasterPrices()
  const products = await prisma.skuMasterPrice.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  })
  return products.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category || "Finished Goods",
    description: p.description || "",
    unitsPerPack: p.unitsPerPack || 1,
    barcode: p.barcode || "",
    defaultPrice: Number(p.defaultPrice),
    uom: p.uom,
    currency: p.currency,
    isActive: p.isActive,
  }))
}

/**
 * Get resolved prices for all active SKUs for a specific customer.
 * Returns default master price if customer doesn't have a specific override.
 */
export async function getResolvedCustomerPricing(customerId: string) {
  await ensureDefaultSkuMasterPrices()

  const [masterPrices, customerPrices] = await Promise.all([
    prisma.skuMasterPrice.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customerSkuPrice.findMany({ where: { customerId } }),
  ])

  const customMap = new Map(customerPrices.map(cp => [cp.sku, Number(cp.unitPrice)]))

  return masterPrices.map(mp => {
    const custom = customMap.get(mp.sku)
    const hasCustom = custom !== undefined
    const effectivePrice = hasCustom ? custom : Number(mp.defaultPrice)

    return {
      sku: mp.sku,
      name: mp.name,
      uom: mp.uom,
      currency: mp.currency,
      category: mp.category || "Finished Goods",
      unitsPerPack: mp.unitsPerPack || 1,
      defaultPrice: Number(mp.defaultPrice),
      customerPrice: effectivePrice,
      isCustom: hasCustom,
    }
  })
}

/**
 * Quick lookup for a single customer & SKU.
 */
export async function resolveSkuPrice(customerId: string | null | undefined, sku: string): Promise<{
  unitPrice: number
  isCustom: boolean
  uom: string
  name: string
}> {
  const normalizedSku = sku.trim()

  if (customerId) {
    const custom = await prisma.customerSkuPrice.findUnique({
      where: { customerId_sku: { customerId, sku: normalizedSku } },
    })
    if (custom) {
      const master = await prisma.skuMasterPrice.findUnique({ where: { sku: normalizedSku } })
      return {
        unitPrice: Number(custom.unitPrice),
        isCustom: true,
        uom: custom.uom || master?.uom || "CTN",
        name: master?.name || SKU_LABEL_MAP[normalizedSku] || normalizedSku,
      }
    }
  }

  // Fallback to SkuMasterPrice
  const master = await prisma.skuMasterPrice.findUnique({
    where: { sku: normalizedSku },
  })
  if (master) {
    return {
      unitPrice: Number(master.defaultPrice),
      isCustom: false,
      uom: master.uom || "CTN",
      name: master.name,
    }
  }

  // Fallback to hardcoded default
  const def = STANDARD_FINISHED_GOOD_SKUS.find(s => s.sku === normalizedSku)
  return {
    unitPrice: def?.defaultPrice || 0,
    isCustom: false,
    uom: def?.uom || "CTN",
    name: def?.name || SKU_LABEL_MAP[normalizedSku] || normalizedSku,
  }
}

/**
 * Calculate line totals and subtotal for warehouse or sales ordering delivery items.
 */
export async function calculateDeliveryPricing(
  customerId: string | null | undefined,
  items: Array<{ sku: string; qty: number }>
) {
  let subtotal = 0
  let totalQty = 0

  const lines = await Promise.all(
    items.map(async item => {
      const priceInfo = await resolveSkuPrice(customerId, item.sku)
      const lineTotal = Math.round(item.qty * priceInfo.unitPrice * 100) / 100
      subtotal += lineTotal
      totalQty += item.qty

      return {
        sku: item.sku,
        name: priceInfo.name,
        uom: priceInfo.uom,
        qty: item.qty,
        unitPrice: priceInfo.unitPrice,
        isCustom: priceInfo.isCustom,
        lineTotal,
      }
    })
  )

  return {
    lines,
    totalQty,
    subtotal: Math.round(subtotal * 100) / 100,
    currency: "MYR",
  }
}
