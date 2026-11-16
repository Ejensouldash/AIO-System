"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  ensureDefaultSkuMasterPrices,
  getResolvedCustomerPricing,
  resolveSkuPrice,
  calculateDeliveryPricing,
  STANDARD_FINISHED_GOOD_SKUS,
} from "@/lib/pricing/skuPricing"
import * as xlsx from "xlsx"

export async function getMasterPricesAction() {
  await ensureDefaultSkuMasterPrices()
  const prices = await prisma.skuMasterPrice.findMany({
    orderBy: { createdAt: "asc" },
  })
  return prices.map(p => ({
    ...p,
    category: p.category || "Finished Goods",
    unitsPerPack: p.unitsPerPack || 1,
    defaultPrice: Number(p.defaultPrice),
  }))
}

export async function createProductAction(data: {
  sku: string
  name: string
  defaultPrice: number
  uom?: string
  unitsPerPack?: number
  category?: string
  description?: string
  barcode?: string
}) {
  try {
    const skuClean = data.sku.trim()
    const nameClean = data.name.trim()

    if (!skuClean) return { success: false, error: "SKU code is required." }
    if (!nameClean) return { success: false, error: "Product name is required." }

    const existing = await prisma.skuMasterPrice.findUnique({
      where: { sku: skuClean },
    })

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        await prisma.skuMasterPrice.update({
          where: { sku: skuClean },
          data: {
            name: nameClean,
            defaultPrice: Math.max(0, Number(data.defaultPrice) || 0),
            uom: data.uom?.trim() || "CTN",
            unitsPerPack: Math.max(1, Number(data.unitsPerPack) || 1),
            category: data.category?.trim() || "Finished Goods",
            description: data.description?.trim() || null,
            barcode: data.barcode?.trim() || null,
            isActive: true,
          },
        })
        revalidatePath("/forms/sales-ordering/customers")
        revalidatePath("/forms/warehouse/distribution/new")
        return { success: true, message: "Existing archived SKU reactivated." }
      }
      return { success: false, error: `SKU "${skuClean}" already exists.` }
    }

    await prisma.skuMasterPrice.create({
      data: {
        sku: skuClean,
        name: nameClean,
        defaultPrice: Math.max(0, Number(data.defaultPrice) || 0),
        uom: data.uom?.trim() || "CTN",
        unitsPerPack: Math.max(1, Number(data.unitsPerPack) || 1),
        category: data.category?.trim() || "Finished Goods",
        description: data.description?.trim() || null,
        barcode: data.barcode?.trim() || null,
        isActive: true,
      },
    })

    revalidatePath("/forms/sales-ordering/customers")
    revalidatePath("/forms/warehouse/distribution/new")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateProductDetailsAction(
  sku: string,
  data: {
    name?: string
    defaultPrice?: number
    uom?: string
    unitsPerPack?: number
    category?: string
    description?: string
    barcode?: string
    isActive?: boolean
  }
) {
  try {
    await prisma.skuMasterPrice.update({
      where: { sku },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.defaultPrice !== undefined ? { defaultPrice: Math.max(0, Number(data.defaultPrice) || 0) } : {}),
        ...(data.uom ? { uom: data.uom.trim() } : {}),
        ...(data.unitsPerPack !== undefined ? { unitsPerPack: Math.max(1, Number(data.unitsPerPack) || 1) } : {}),
        ...(data.category ? { category: data.category.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode.trim() || null } : {}),
        ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
      },
    })

    revalidatePath("/forms/sales-ordering/customers")
    revalidatePath("/forms/warehouse/distribution/new")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteProductAction(sku: string) {
  try {
    const isStandard = STANDARD_FINISHED_GOOD_SKUS.some(s => s.sku === sku)
    if (isStandard) {
      await prisma.skuMasterPrice.update({
        where: { sku },
        data: { isActive: false },
      })
      revalidatePath("/forms/sales-ordering/customers")
      revalidatePath("/forms/warehouse/distribution/new")
      return { success: true, message: "Standard product deactivated." }
    }

    const [priceCount, doItemCount] = await Promise.all([
      prisma.customerSkuPrice.count({ where: { sku } }),
      prisma.dOLineItem.count({ where: { sku } }),
    ])

    if (priceCount > 0 || doItemCount > 0) {
      await prisma.skuMasterPrice.update({
        where: { sku },
        data: { isActive: false },
      })
      revalidatePath("/forms/sales-ordering/customers")
      revalidatePath("/forms/warehouse/distribution/new")
      return { success: true, message: "Product archived and deactivated (historical records kept)." }
    }

    await prisma.skuMasterPrice.delete({
      where: { sku },
    })

    revalidatePath("/forms/sales-ordering/customers")
    revalidatePath("/forms/warehouse/distribution/new")
    return { success: true, message: "Product deleted successfully." }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateMasterPriceAction(sku: string, defaultPrice: number) {
  try {
    await prisma.skuMasterPrice.upsert({
      where: { sku },
      create: {
        sku,
        name: STANDARD_FINISHED_GOOD_SKUS.find(s => s.sku === sku)?.name || sku,
        defaultPrice,
      },
      update: {
        defaultPrice,
      },
    })
    revalidatePath("/forms/sales-ordering/customers")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getCustomerPricingAction(customerId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, customerCode: true, legalName: true, tradingName: true },
    })
    if (!customer) return { success: false, error: "Customer not found" }

    const prices = await getResolvedCustomerPricing(customerId)
    return { success: true, customer, prices }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveCustomerSkuPricesAction(
  customerId: string,
  prices: Record<string, number>
) {
  try {
    await prisma.$transaction(async tx => {
      for (const [sku, unitPrice] of Object.entries(prices)) {
        if (Number.isFinite(unitPrice) && unitPrice >= 0) {
          await tx.customerSkuPrice.upsert({
            where: { customerId_sku: { customerId, sku } },
            create: {
              customerId,
              sku,
              unitPrice,
            },
            update: {
              unitPrice,
            },
          })
        }
      }
    })

    revalidatePath("/forms/sales-ordering/customers")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteCustomerSkuPriceOverrideAction(customerId: string, sku: string) {
  try {
    await prisma.customerSkuPrice.deleteMany({
      where: { customerId, sku },
    })
    revalidatePath("/forms/sales-ordering/customers")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Import Customer SKU Prices via Excel.
 * Supports:
 * Format A (Matrix):
 * [Customer ID | Customer Name | BUBBLES O2 425x24 / p425_24 | BUBBLES O2 425x6 / p425_6 | p800_12 | p800_20]
 * Format B (Tabular):
 * [Customer ID | SKU | Unit Price]
 */
export async function importCustomerPricesExcelAction(formData: FormData) {
  try {
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return { success: false, error: "Excel file is required." }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = xlsx.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" })

    if (rows.length === 0) {
      return { success: false, error: "The Excel sheet is empty." }
    }

    // Load customers for fast lookup
    const allCustomers = await prisma.customer.findMany({
      select: { id: true, customerCode: true },
    })
    const customerMapByCode = new Map(allCustomers.map(c => [c.customerCode.trim().toUpperCase(), c.id]))

    let updatedCount = 0

    // Detect format
    const sampleRow = rows[0]
    const keys = Object.keys(sampleRow)
    const hasExplicitSkuCol = keys.some(k => /sku|item/i.test(k)) && keys.some(k => /price|unit\s*price|harga/i.test(k))

    await prisma.$transaction(async tx => {
      if (hasExplicitSkuCol) {
        // Tabular format: [Customer ID, SKU, Price]
        for (const row of rows) {
          const custIdRaw = String(row["Customer ID"] || row["CustomerID"] || row["Customer Code"] || row["ID"] || "").trim().toUpperCase()
          const skuRaw = String(row["SKU"] || row["Item"] || row["Product"] || "").trim().toLowerCase()
          const priceRaw = parseFloat(String(row["Unit Price"] || row["Price"] || row["Harga"] || 0))

          const customerId = customerMapByCode.get(custIdRaw)
          if (!customerId || !skuRaw || isNaN(priceRaw) || priceRaw <= 0) continue

          // Match SKU key
          let matchedSku = skuRaw
          if (skuRaw.includes("425") && skuRaw.includes("24")) matchedSku = "p425_24"
          else if (skuRaw.includes("425") && skuRaw.includes("6")) matchedSku = "p425_6"
          else if (skuRaw.includes("800") && skuRaw.includes("12")) matchedSku = "p800_12"
          else if (skuRaw.includes("800") && skuRaw.includes("20")) matchedSku = "p800_20"

          await tx.customerSkuPrice.upsert({
            where: { customerId_sku: { customerId, sku: matchedSku } },
            create: { customerId, sku: matchedSku, unitPrice: priceRaw },
            update: { unitPrice: priceRaw },
          })
          updatedCount++
        }
      } else {
        // Matrix format: [Customer ID, p425_24, p425_6, p800_12, p800_20]
        const skuColumns: Array<{ colKey: string; sku: string }> = []
        for (const key of keys) {
          const lower = key.toLowerCase()
          if (lower.includes("425") && lower.includes("24")) skuColumns.push({ colKey: key, sku: "p425_24" })
          else if (lower.includes("425") && lower.includes("6")) skuColumns.push({ colKey: key, sku: "p425_6" })
          else if (lower.includes("800") && lower.includes("12")) skuColumns.push({ colKey: key, sku: "p800_12" })
          else if (lower.includes("800") && lower.includes("20")) skuColumns.push({ colKey: key, sku: "p800_20" })
        }

        for (const row of rows) {
          const custIdRaw = String(row["Customer ID"] || row["CustomerID"] || row["Customer Code"] || row["ID"] || "").trim().toUpperCase()
          const customerId = customerMapByCode.get(custIdRaw)
          if (!customerId) continue

          for (const mapping of skuColumns) {
            const rawVal = row[mapping.colKey]
            const price = parseFloat(String(rawVal))
            if (Number.isFinite(price) && price > 0) {
              await tx.customerSkuPrice.upsert({
                where: { customerId_sku: { customerId, sku: mapping.sku } },
                create: { customerId, sku: mapping.sku, unitPrice: price },
                update: { unitPrice: price },
              })
              updatedCount++
            }
          }
        }
      }
    })

    revalidatePath("/forms/sales-ordering/customers")
    return {
      success: true,
      message: `Successfully processed pricing for ${updatedCount} customer SKU records.`,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
